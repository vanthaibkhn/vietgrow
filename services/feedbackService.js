// services/feedbackService.js (đã tối ưu)
import fs from "fs/promises";
import path from "path";
import { db } from "../lib/firebase.js";

const FEEDBACK_FILE = path.join(process.cwd(), "data/feedback.json");

export const feedbackService = {
  /**
   * 🔹 Ghi nhận phản hồi người dùng
   * @param {Object} data
   * @param {string} data.questionId - ID hoặc hash của câu hỏi
   * @param {string} data.rating - "helpful" | "not_helpful"
   * @param {string|null} data.note - Ghi chú của người dùng (nếu có)
   * @param {string} data.userIp - IP người gửi
   */
  async saveFeedback({ questionId = null, rating, note = null, userIp }) {
    const entry = {
      questionId,
      rating,
      note,
      userIp,
      createdAt: new Date().toISOString(),
    };

    console.log("[feedbackService] 📨 Saving feedback:", rating, "| question:", questionId);

    // 1️⃣ Ghi local fail-safe (append dạng log)
    try {
      await fs.mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
      const line = JSON.stringify(entry) + "\n";
      await fs.appendFile(FEEDBACK_FILE, line, "utf-8");
      console.log("[feedbackService] 💾 Local feedback log appended");
    } catch (err) {
      console.warn("[feedbackService] ⚠️ Local feedback save failed:", err.message);
    }

    // 2️⃣ Ghi Firestore song song
    try {
      if (!db) throw new Error("Firestore not initialized");
      await db.collection("feedback").add(entry);
      console.log("[feedbackService] ☁️ Saved to Firestore");
    } catch (err) {
      console.error("[feedbackService] ⚠️ Firestore save failed:", err.message);
    }
  },
};

