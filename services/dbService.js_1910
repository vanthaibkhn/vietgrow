// services/dbService.js
// ✅ Firestore + local backup service
import fs from 'fs/promises';
import path from 'path';
import { db } from '../lib/firebase.js';

const QA_FILE = path.join(process.cwd(), 'data/qa.json');

export const dbService = {
  /**
   * 🔹 Lưu câu hỏi–trả lời (song song Firestore + local)
   */
  async saveQA({ question, answer, embedding, userIp, uid }) {
    const entry = {
      question,
      answer,
      embedding,
      userIp,
      uid,
      createdAt: new Date().toISOString(),
    };

    console.log('[dbService] 💾 Saving QA entry for question:', question.slice(0, 40));

    // Ghi local trước (fail-safe)
    try {
      const raw = await fs.readFile(QA_FILE, 'utf-8').catch(() => '{}');
      const json = raw ? JSON.parse(raw) : {};
      json[Date.now()] = entry;
      await fs.writeFile(QA_FILE, JSON.stringify(json, null, 2), 'utf-8');
      console.log('[dbService] ✅ Local QA backup written');
    } catch (err) {
      console.warn('[dbService] ⚠️ Local backup failed:', err.message);
    }

    // Ghi Firestore song song
    try {
      if (!db) throw new Error('Firestore not initialized');
      await db.collection('questions').add(entry);
      console.log('[dbService] ✅ Firestore QA saved');
    } catch (err) {
      console.error('[dbService] ⚠️ Firestore save failed:', err.message);
    }
  },

  /**
   * 🔹 Cập nhật quota user (dùng trong rateLimitService)
   */
  async updateUserQuota(uid, freeQuotaUsed, lastResetDate) {
    try {
      if (!db) throw new Error('Firestore not initialized');
      await db.collection('users').doc(uid).update({ freeQuotaUsed, lastResetDate });
      console.log(`[dbService] ✅ Updated user quota (${uid}: ${freeQuotaUsed})`);
    } catch (err) {
      console.warn('[dbService] ⚠️ updateUserQuota failed:', err.message);
    }
  },
};

