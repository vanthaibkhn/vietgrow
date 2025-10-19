// services/rateLimitService.js
// Rate limit service: in-memory cache + async persist + daily cleanup
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LIMIT_FILE = path.join(process.cwd(), 'data/limits.json');
const LIMIT_COUNT = parseInt(process.env.FREE_LIMIT_PER_IP || '3', 10);
const KEEP_DAYS = parseInt(process.env.LIMIT_KEEP_DAYS || '1', 10);
const WRITE_DEBOUNCE_MS = 300;

let limitsCache = {};      // in-memory: { ip: { date: 'YYYY-MM-DD', count: n } }
let lastCleanupDate = null;
let pendingWrite = false;
let loaded = false;

/* ---------- Internal helpers ---------- */

async function ensureLoadedCache() {
  if (loaded) return;
  try {
    if (!existsSync(LIMIT_FILE)) {
      console.log('[RateLimit] ⚙️ limits.json not found → creating new file');
      await fs.writeFile(LIMIT_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
    const raw = await fs.readFile(LIMIT_FILE, 'utf-8');
    limitsCache = raw ? JSON.parse(raw) : {};
    console.log('[RateLimit] ✅ Cache loaded (' + Object.keys(limitsCache).length + ' records)');
    loaded = true;
  } catch (err) {
    console.error('[RateLimit] 💥 Failed to load limits file, initializing empty cache:', err.message);
    limitsCache = {};
    try {
      await fs.writeFile(LIMIT_FILE, JSON.stringify({}, null, 2), 'utf-8');
    } catch (e) {
      console.error('[RateLimit] 💥 Could not create limits file:', e.message);
    }
    loaded = true;
  }
}

function runCleanupIfNeeded(today) {
  if (lastCleanupDate === today) {
    // Already cleaned today
    console.log('[RateLimit] 🟢 Cleanup already done today:', today);
    return;
  }

  lastCleanupDate = today;
  console.log('[RateLimit] 🧹 Running cleanupOldLimits() (async)');

  // run cleanup asynchronously (fire-and-forget)
  (async () => {
    try {
      let changed = false;
      const todayTime = new Date(today).getTime();
      for (const [ip, record] of Object.entries(limitsCache)) {
        try {
          const recordTime = new Date(record.date).getTime();
          const diffDays = Math.floor((todayTime - recordTime) / (1000 * 60 * 60 * 24));
          if (diffDays >= KEEP_DAYS) {
            console.log(`[RateLimit] 🧽 Removing stale record for ${ip} (${diffDays}d old)`);
            delete limitsCache[ip];
            changed = true;
          }
        } catch {
          delete limitsCache[ip];
          changed = true;
        }
      }
      if (changed) {
        await schedulePersist();
        console.log('[RateLimit] 🧾 Cleanup completed and file updated');
      } else {
        console.log('[RateLimit] ✅ No stale records to remove');
      }
    } catch (err) {
      console.error('[RateLimit] 💥 Cleanup failed:', err.message);
    }
  })();
}

async function schedulePersist() {
  if (pendingWrite) return;
  pendingWrite = true;
  setTimeout(async () => {
    try {
      await fs.writeFile(LIMIT_FILE, JSON.stringify(limitsCache, null, 2), 'utf-8');
      console.log('[RateLimit] 💾 Persisted limitsCache to disk');
    } catch (err) {
      console.error('[RateLimit] 💥 Persist failed:', err.message);
    } finally {
      pendingWrite = false;
    }
  }, WRITE_DEBOUNCE_MS);
}

/* ---------- Exported service ---------- */

export const rateLimitService = {
  /**
   * Load cache into memory (call once on server start)
   */
  async init() {
    console.log('[RateLimit] ⚙️ init() called');
    await ensureLoadedCache();
  },

  /**
   * Check limit by IP (throws 'limit_exceeded' error when over)
   */
  async checkIp(ip) {
    console.log('[RateLimit] ▶️ checkIp() start for:', ip);
    const today = new Date().toISOString().slice(0, 10);

    await ensureLoadedCache();
    runCleanupIfNeeded(today); // non-blocking cleanup

    const record = limitsCache[ip] || { date: today, count: 0 };

    if (record.date !== today) {
      console.log(`[RateLimit] 🔄 Reset count for ${ip} (new day ${today})`);
      record.count = 0;
      record.date = today;
    }

    if (record.count >= LIMIT_COUNT) {
      console.log(`[RateLimit] ❌ Limit exceeded (${record.count}/${LIMIT_COUNT}) for IP ${ip}`);
      throw new Error('limit_exceeded');
    }

    record.count++;
    record.date = today;
    limitsCache[ip] = record;

    // persist asynchronously
    schedulePersist();

    console.log(`[RateLimit] ✅ IP ${ip} allowed (${record.count}/${LIMIT_COUNT})`);
    return true;
  },

  /**
   * Check limit by user object (user is expected to be an object from Firestore
   * containing freeQuotaUsed and lastResetDate). Throws 'limit_exceeded' when over.
   * Also updates user's quota via global dbService if available.
   */
  async checkUser(user) {
    const idStr = (user && (user.email || user.uid)) || 'unknown';
    console.log('[RateLimit] ▶️ checkUser() start for:', idStr);

    if (!user || !user.uid) {
      console.log('[RateLimit] ⚠️ No valid user provided → allow by default');
      return true;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      // Normalize fields
      let { freeQuotaUsed = 0, lastResetDate = null, uid } = user;

      if (lastResetDate !== today) {
        console.log(`[RateLimit] 🔄 Reset user quota for ${uid} (new day ${today})`);
        freeQuotaUsed = 0;
        lastResetDate = today;
      }

      if (freeQuotaUsed >= LIMIT_COUNT) {
        console.log(`[RateLimit] ❌ User ${uid} exceeded quota (${freeQuotaUsed}/${LIMIT_COUNT})`);
        throw new Error('limit_exceeded');
      }

      freeQuotaUsed++;
      // Attempt to persist via dbService if available (global.dbService)
      if (global.dbService && typeof global.dbService.updateUserQuota === 'function') {
        try {
          await global.dbService.updateUserQuota(uid, freeQuotaUsed, today);
          console.log('[RateLimit] ✅ Updated quota via global.dbService');
        } catch (err) {
          console.warn('[RateLimit] ⚠️ global.dbService.updateUserQuota failed:', err.message);
        }
      } else {
        console.log('[RateLimit] ℹ️ No global.dbService.updateUserQuota — not persisted to remote');
      }

      console.log(`[RateLimit] ✅ User ${uid} allowed (count=${freeQuotaUsed}/${LIMIT_COUNT})`);
      return true;
    } catch (err) {
      if (err.message === 'limit_exceeded') throw err;
      console.error('[RateLimit] 💥 Error in checkUser():', err.message);
      throw new Error('rate_limit_internal_error');
    }
  },

  /**
   * Combined wrapper: if user provided -> checkUser, otherwise checkIp.
   */
  async check(ip, user) {
    console.log('[RateLimit] 🚦 check() called →', ip, user && (user.uid || user.email));
    if (user) {
      return await this.checkUser(user);
    }
    return await this.checkIp(ip);
  },
};

