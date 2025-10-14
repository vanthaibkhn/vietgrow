// services/dbService.js
// Dual mode: lưu Firestore (nếu bật) + backup local JSON (Filestore).
// Nếu Firestore bị lỗi → tự fallback sang local.

import fs from "fs";
import path from "path";
import { db } from "../lib/firebase.js";

const DATA_DIR = process.env.DATA_DIR || "./data";

export const dbService = {
  async saveQA({ question, answer, embedding, userIp }) {
    const data = {
      question,
      answer,
      embedding,
      userIp,
      createdAt: new Date().toISOString(),
    };

    const safeIp = (userIp || "unknown").replace(/[:.]/g, "_");
    const dir = path.join(DATA_DIR, "questions");
    const filePath = path.join(dir, `${Date.now()}-${safeIp}.json`);

    try {
      // 1️⃣ Ghi local backup trước
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`[dbService] 💾 Backup local: ${filePath}`);

      // 2️⃣ Lưu Firestore song song (nếu có db)
      if (db) {
        db.collection("questions")
          .add(data)
          .then((docRef) =>
            console.log(`[dbService] ☁️ Firestore saved: ${docRef.id}`)
          )
          .catch((err) =>
            console.error("[dbService] ❌ Firestore save error:", err.message)
          );
      } else {
        console.warn("[dbService] ⚠️ Firestore disabled — local only.");
      }
    } catch (err) {
      console.error("[dbService] ❌ Lỗi lưu QA:", err.message);
    }
  },
};

