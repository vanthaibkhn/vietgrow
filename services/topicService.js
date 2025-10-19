// services/topicService.js
// ✅ VietGrow Topic Service — gom nhóm câu hỏi tương tự thành "chủ đề cộng đồng"
// Hỗ trợ Firestore + local fallback, có tính điểm mức độ quan tâm (popularity)

import { db } from "../lib/firebase.js";
import fs from "fs/promises";
import path from "path";
import { vectorService } from "./vectorService.js";

const TOPIC_FILE = path.join(process.cwd(), "data/topics.json");
const SIMILARITY_THRESHOLD = parseFloat(process.env.TOPIC_SIMILARITY_THRESHOLD || "0.85");

export const topicService = {
  /**
   * 🔹 Lấy tất cả câu hỏi từ Firestore hoặc local
   */
  async getAllQuestions() {
    try {
      if (!db) throw new Error("Firestore not initialized");
      const snap = await db.collection("questions").get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("[topicService] ⚠️ Firestore unavailable, fallback to local QA.");
      const raw = await fs.readFile(path.join(process.cwd(), "data/qa.json"), "utf-8").catch(() => "{}");
      return Object.values(JSON.parse(raw || "{}"));
    }
  },

  /**
   * 🔹 Gom nhóm câu hỏi tương tự (theo từ khóa hoặc embedding)
   */
  async buildWeeklyTopics() {
    console.log("[topicService] 🧠 Building weekly topics...");
    const all = await this.getAllQuestions();

    if (!all.length) {
      console.log("[topicService] ⚠️ No questions found. Skipping topic build.");
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

        // 🔸 Ưu tiên embedding similarity nếu có vectorService
        let score = 0;
        try {
          const sim = await vectorService.findSimilar(q2.question);
          if (sim?.similarTo?.includes(q1.question.slice(0, 20))) score = 0.9;
        } catch {
          // fallback tính tỉ lệ từ trùng
          const overlap = q1.question
            .split(" ")
            .filter((w) => q2.question.includes(w)).length;
          score = overlap / Math.max(q1.question.split(" ").length, 1);
        }

        if (score >= SIMILARITY_THRESHOLD) {
          group.push(q2);
          visited.add(j);
        }
      }

      const title = group[0].question.slice(0, 60);
      const questionCount = group.length;
      const popularity = group.reduce((acc, g) => acc + (g.feedbackCount || 1), 0);

      topics.push({
        title,
        questionCount,
        samples: group.slice(0, 3).map((q) => q.question),
        popularity,
        createdAt: new Date().toISOString(),
      });
    }

    // Loại trùng chủ đề cũ
    const recent = await this.getExistingTopics();
    const newTopics = topics.filter(
      (t) => !recent.some((r) => this.isDuplicateTopic(t, r))
    );

    await this.saveTopics(newTopics);
    console.log(`[topicService] ✅ Created ${newTopics.length} new topics.`);

    return newTopics;
  },

  /**
   * 🔹 Lấy danh sách topics cũ từ Firestore hoặc local
   */
  async getExistingTopics() {
    try {
      if (!db) throw new Error("Firestore not initialized");
      const snap = await db.collection("topics").orderBy("createdAt", "desc").limit(50).get();
      return snap.docs.map((d) => d.data());
    } catch {
      const raw = await fs.readFile(TOPIC_FILE, "utf-8").catch(() => "[]");
      return JSON.parse(raw);
    }
  },

  /**
   * 🔹 So sánh chủ đề trùng (>=70% tiêu đề giống nhau)
   */
  isDuplicateTopic(t1, t2) {
    const s1 = t1.title.toLowerCase();
    const s2 = t2.title.toLowerCase();
    const overlap = s1.split(" ").filter((w) => s2.includes(w)).length;
    const score = overlap / Math.max(s1.split(" ").length, 1);
    return score >= 0.7;
  },

  /**
   * 🔹 Lưu topics mới ra Firestore và local
   */
  async saveTopics(topics) {
    if (!topics.length) return;

    try {
      if (db) {
        const col = db.collection("topics");
        for (const t of topics) await col.add(t);
        console.log("[topicService] ☁️ Topics saved to Firestore");
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

