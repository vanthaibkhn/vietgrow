// pages/api/_cron_learn.js
// ✅ Cron job: tổng hợp "AI học được gì từ cộng đồng tuần này"
import { db } from "@/lib/firebase.js";
import fs from "fs/promises";
import path from "path";
import { openai } from "@/lib/openai.js";

const SUMMARY_FILE = path.join(process.cwd(), "data/learning_summaries.json");

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("[_cron_learn] 🚀 Bắt đầu tổng hợp kiến thức cộng đồng...");

    // 1️⃣ Lấy dữ liệu feedback & topics gần nhất
    let feedbacks = [];
    let topics = [];
    if (db) {
      const fSnap = await db
        .collection("feedback")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
      feedbacks = fSnap.docs.map((d) => d.data());

      const tSnap = await db
        .collection("topics")
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
      topics = tSnap.docs.map((d) => d.data());
    }

    if (!feedbacks.length && !topics.length) {
      return res.status(200).json({ message: "Không có dữ liệu để học tuần này." });
    }

    // 2️⃣ Chuẩn bị prompt cho OpenAI
    const feedbackSummary = feedbacks
      .slice(0, 50)
      .map((f) => `- ${f.rating}: ${f.note || "(không ghi chú)"}`)
      .join("\n");

    const topicSummary = topics
      .map((t) => `• ${t.title} (${t.questionCount} câu hỏi, độ quan tâm ${t.popularity})`)
      .join("\n");

    const prompt = `
Bạn là VietGrow AI - hệ thống học hỏi từ cộng đồng Việt Nam.
Dưới đây là phản hồi và chủ đề trong tuần vừa qua.
Hãy viết một bản tóm tắt ngắn (5-10 dòng) về những gì AI học được từ cộng đồng tuần này,
và các xu hướng, chủ đề, hoặc cải thiện cần lưu ý.

=== PHẢN HỒI NGƯỜI DÙNG ===
${feedbackSummary}

=== CHỦ ĐỀ NỔI BẬT ===
${topicSummary}

Hãy trả lời bằng tiếng Việt, giọng văn gần gũi và tự nhiên.
`;

    console.log("[_cron_learn] 🧠 Gọi OpenAI tổng hợp...");
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const summary =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Không tạo được bản tóm tắt tuần này.";

    const entry = {
      summary,
      feedbackCount: feedbacks.length,
      topicCount: topics.length,
      createdAt: new Date().toISOString(),
    };

    // 3️⃣ Lưu Firestore
    try {
      if (db) {
        await db.collection("learning_summaries").add(entry);
        console.log("[_cron_learn] ☁️ Saved summary to Firestore.");
      }
    } catch (err) {
      console.warn("[_cron_learn] ⚠️ Firestore save failed:", err.message);
    }

    // 4️⃣ Lưu local file
    try {
      await fs.appendFile(SUMMARY_FILE, JSON.stringify(entry) + "\n", "utf-8");
      console.log("[_cron_learn] 💾 Saved summary locally.");
    } catch (err) {
      console.warn("[_cron_learn] ⚠️ Local save failed:", err.message);
    }

    console.log("[_cron_learn] ✅ Hoàn tất tổng hợp tuần.");
    return res.status(200).json({ message: "OK", summary });
  } catch (err) {
    console.error("[_cron_learn] 💥 Lỗi tổng hợp:", err.message);
    return res.status(500).json({ error: "Không thể tổng hợp tuần này." });
  }
}

