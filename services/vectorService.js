// services/vectorService.js
// Handles embedding creation and similarity search using Firestore (can switch to pgvector later)
import { db } from '../lib/firebase.js';
import { openai } from '../lib/openai.js';

export const vectorService = {
  async createEmbedding(text) {
    const res = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      input: text,
    });
    return res.data[0].embedding;
  },

  async findSimilar(text, threshold = 0.85) {
    if (!db) return null;
    const embeddingRes = await this.createEmbedding(text);
    const snapshot = await db.collection('questions').get();
    let best = null;
    let bestScore = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.embedding) continue;
      const score = this.cosineSimilarity(embeddingRes, data.embedding);
      if (score > threshold && score > bestScore) {
        best = data;
        bestScore = score;
      }
    }
    return best;
  },

  cosineSimilarity(a, b) {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
    const magB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
    return dot / (magA * magB);
  },

  async saveEmbedding(question, embedding) {
    if (!db) return;
    await db.collection('questions').add({ question, embedding, createdAt: new Date() });
  },
};
