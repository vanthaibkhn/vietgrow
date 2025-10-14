// services/feedbackService.js
import fs from 'fs';
import path from 'path';
import { db } from '../lib/firebase.js';

const FEEDBACK_FILE = './data/feedback.json';

export const feedbackService = {
  async saveFeedback({ question, useful, userIp }) {
    const feedback = {
      question,
      useful,
      userIp,
      timestamp: new Date().toISOString(),
    };

    // --- Lưu local (backup) ---
    try {
      let data = {};
      if (fs.existsSync(FEEDBACK_FILE)) {
        data = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
      }
      if (!data[userIp]) data[userIp] = {};
      data[userIp][question] = { useful, timestamp: feedback.timestamp };
      fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2));
      console.log(`[feedbackService] 💾 Lưu local feedback: ${userIp}`);
    } catch (err) {
      console.error('[feedbackService] ❌ Lỗi lưu local:', err.message);
    }

    // --- Lưu Firestore (nếu bật) ---
    if (db) {
      try {
        await db.collection('feedbacks').add(feedback);
        console.log('[feedbackService] ☁️ Lưu feedback lên Firestore');
      } catch (err) {
        console.error('[feedbackService] ⚠️ Firestore feedback lỗi:', err.message);
      }
    }
  },
};

