// services/feedbackService.js
// ✅ Ghi nhận feedback người dùng (helpful / not helpful + note)
import fs from 'fs/promises';
import path from 'path';
import { db } from '../lib/firebase.js';

const FEEDBACK_FILE = path.join(process.cwd(), 'data/feedback.json');

export const feedbackService = {
  async saveFeedback({ questionId, rating, note, userIp }) {
    console.log('[feedbackService] 📨 Saving feedback for:', questionId);
    const entry = {
      questionId,
      rating, // 'helpful' | 'not_helpful'
      note: note || null,
      userIp,
      createdAt: new Date().toISOString(),
    };

    // Ghi local (fail-safe)
    try {
      const raw = await fs.readFile(FEEDBACK_FILE, 'utf-8').catch(() => '{}');
      const json = raw ? JSON.parse(raw) : {};
      json[Date.now()] = entry;
      await fs.writeFile(FEEDBACK_FILE, JSON.stringify(json, null, 2), 'utf-8');
      console.log('[feedbackService] ✅ Local feedback written');
    } catch (err) {
      console.warn('[feedbackService] ⚠️ Local write failed:', err.message);
    }

    // Ghi Firestore song song
    try {
      if (!db) throw new Error('Firestore not initialized');
      await db.collection('feedback').add(entry);
      console.log('[feedbackService] ✅ Firestore feedback saved');
    } catch (err) {
      console.error('[feedbackService] ⚠️ Firestore save failed:', err.message);
    }
  },
};

