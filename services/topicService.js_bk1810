// services/topicService.js
// ✅ Gom nhóm câu hỏi tương tự thành "Topic cộng đồng"
// Hỗ trợ Firestore + local fallback

import { db } from "../lib/firebase.js";
import fs from "fs/promises";
import path from "path";
import { vectorService } from "./vectorService.js";

const TOPIC_FILE = path.join(process.cwd(), "data/topics.json");
const SIMILARITY_THRESHOLD = parseFloat(process.env.TOPIC_SIMILARITY_THRESHOLD || "0.85");

export const topicService = {
  /**
   * 🔹 Lấy danh sách tất cả câu hỏi từ Firestore hoặc local
   */
  async getAllQuestions() {
    try {
      if (!db) throw new Error("Firestore not initialized");
      const snap = await db.collection("questions").get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      console.warn("[topicService] ⚠️ Using local fallback for questions");
      const raw = await fs.readFile(path.join(process.cwd(), "data/qa.json"), "utf-8").catch(() => "{}");
      return Object.values(JSON.parse(raw || "{}"));
    }
  },

  /**
   * 🔹 Gom nhóm câu hỏi tương tự (theo từ khoá / mock similarity)
   */
  async buildWeeklyTopics() {
    console.log("[topicService] 🧠 Building weekly topics...");
    const all = await this.getAllQuestions();

    if (!all.length) {
      console.log("[topicService] ⚠️ No questions found, skip topic build.");
      return [];
    }

    const topics = [];
    const visited = new Set();

    for (let i = 0; i < all.length; i++) {
      if (visited.has(i)) continue;
      const q1 = all[i];
      const group = [q1];
      visited.add(i);

      for (let j = i + 1; j < all.length; j++) {
        if (visited.has(j)) continue;
        const q2 = all[j];

        // Mock similarity: tỉ lệ từ trùng
        const overlap = q1.question.split(" ").filter((w) => q2.question.includes(w)).length;
        const score = overlap / Math.max(q1.question.split(" ").length, 1);
        if (score >= SIMILARITY_THRESHOLD) {
          group.push(q2);
          visited.add(j);
        }
      }

      const title = group[0].question.slice(0, 50);
      topics.push({
        title,
        questionCount: group.length,
        samples: group.slice(0, 3).map((q) => q.question),
        createdAt: new Date().toISOString(),
      });
    }

    console.log(`[topicService] ✅ Built ${topics.length} topics.`);

    await this.saveTopics(topics);
    return topics;
  },

  /**
   * 🔹 Lưu topics ra Firestore và local
   */
  async saveTopics(topics) {
    try {
      if (db) {
        const col = db.collection("topics");
        for (const topic of topics) await col.add(topic);
        console.log("[topicService] ✅ Topics saved to Firestore");
      }
    } catch (err) {
      console.warn("[topicService] ⚠️ Firestore save failed:", err.message);
    }

    try {
      await fs.writeFile(TOPIC_FILE, JSON.stringify(topics, null, 2), "utf-8");
      console.log("[topicService] 💾 Topics written locally");
    } catch (err) {
      console.warn("[topicService] ⚠️ Local save failed:", err.message);
    }
  },
};

