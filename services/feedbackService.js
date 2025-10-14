// services/feedbackService.js
// Handles feedback data from users
import { db } from '../lib/firebase.js';

export const feedbackService = {
  async recordFeedback({ questionId, rating, note }) {
    if (!db) return;
    await db.collection('feedback').add({
      questionId,
      rating,
      note,
      createdAt: new Date(),
    });
  },
};
