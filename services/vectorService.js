// services/vectorService.js
// ✅ Quản lý lưu trữ embedding: local mock hoặc Firestore/vectorDB
import fs from 'fs/promises';
import path from 'path';

const VECTOR_FILE = path.join(process.cwd(), 'data/vectors.json');
const USE_VECTOR_MOCK = String(process.env.USE_VECTOR_MOCK || 'false').toLowerCase() === 'true';

let vectorCache = {};
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await fs.readFile(VECTOR_FILE, 'utf-8');
    vectorCache = raw ? JSON.parse(raw) : {};
    console.log('[vectorService] ✅ Cache loaded (' + Object.keys(vectorCache).length + ' vectors)');
  } catch {
    console.log('[vectorService] ⚙️ No existing vector file, initializing new.');
    vectorCache = {};
  }
  loaded = true;
}

export const vectorService = {
  /**
   * 🔹 Tạo embedding mock hoặc thực tế (được gọi bởi aiService)
   */
  async createEmbedding(text) {
    if (USE_VECTOR_MOCK) {
      console.log('[vectorService] 🧩 Using mock embedding for:', text.slice(0, 40));
      return Array.from({ length: 8 }, () => Math.random());
    }
    throw new Error('createEmbedding() called without mock; use aiService’s OpenAI embedding.');
  },

  /**
   * 🔹 Lưu embedding (local hoặc DB thật sau này)
   */
  async saveEmbedding(question, embedding) {
    if (!embedding) {
      console.warn('[vectorService] ⚠️ No embedding provided → skip save.');
      return;
    }

    await ensureLoaded();
    vectorCache[question] = embedding;

    try {
      await fs.writeFile(VECTOR_FILE, JSON.stringify(vectorCache, null, 2), 'utf-8');
      console.log('[vectorService] 💾 Embedding saved:', question.slice(0, 40));
    } catch (err) {
      console.error('[vectorService] 💥 Failed to save embedding:', err.message);
    }
  },

  /**
   * 🔹 Tìm câu tương tự dựa trên cosine similarity (mock)
   */
  async findSimilar(question) {
    await ensureLoaded();

    const normalized = question.trim().toLowerCase();
    const keys = Object.keys(vectorCache);
    if (keys.length === 0) return null;

    let bestKey = null;
    let bestScore = -1;
    const threshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.85');

    // Mock cosine similarity bằng cách đếm từ trùng
    for (const key of keys) {
      const overlap = key.split(' ').filter((w) => normalized.includes(w)).length;
      const score = overlap / Math.max(key.split(' ').length, 1);
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }

    if (bestScore >= threshold && bestKey) {
      console.log(`[vectorService] 🧠 Similar question found (score=${bestScore.toFixed(2)})`);
      return { answer: 'Từ cache: ' + bestKey, similarTo: bestKey };
    }
    console.log('[vectorService] 🔍 No similar question above threshold');
    return null;
  },
};

