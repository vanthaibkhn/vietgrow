// services/dbService.js
// ✅ Firestore (Admin SDK) + local backup service
import fs from "fs/promises";
import path from "path";
import { getFirebaseAdmin } from "../lib/firebase.js";

const QA_FILE = path.join(process.cwd(), "data/qa.json");

export const dbService = {
  async saveQA({ question, answer, embedding, userIp, uid }) {
    const { db } = getFirebaseAdmin();
    const entry = {
      question,
      answer,
      embedding,
      userIp,
      uid,
      createdAt: new Date().toISOString(),
    };

    console.log("[dbService] 💾 Saving QA entry for question:", question.slice(0, 60));

    // 🔸 Local backup
    try {
      const raw = await fs.readFile(QA_FILE, "utf-8").catch(() => "{}");
      const json = raw ? JSON.parse(raw) : {};
      json[Date.now()] = entry;
      await fs.writeFile(QA_FILE, JSON.stringify(json, null, 2), "utf-8");
      console.log("[dbService] ✅ Local QA backup written");
    } catch (err) {
      console.warn("[dbService] ⚠️ Local backup failed:", err.message);
    }

    // 🔸 Save Firestore
    try {
      if (!db) throw new Error("Firestore not initialized");
      await db.collection("questions").add(entry);
      console.log("[dbService] ✅ Firestore QA saved successfully");
    } catch (err) {
      console.error("[dbService] 💥 Firestore save failed:", err.message);
    }
  },

  async updateUserQuota(uid, freeQuotaUsed, lastResetDate) {
    const { db } = getFirebaseAdmin();
    try {
      if (!db) throw new Error("Firestore not initialized");
      await db.collection("users").doc(uid).update({
        freeQuotaUsed,
        lastResetDate,
      });
      console.log(`[dbService] ✅ Updated user quota (${uid}: ${freeQuotaUsed})`);
    } catch (err) {
      console.warn("[dbService] ⚠️ updateUserQuota failed:", err.message);
    }
  },
};

