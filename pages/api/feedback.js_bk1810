import fs from "fs";
import path from "path";
import { db } from "../../lib/firebase.js"; // Firestore nếu USE_FIRESTORE=true

// Đường dẫn file backup local
const feedbackPath = path.join(process.cwd(), "data/feedback.json");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, answer, feedback, model } = req.body;
    const userIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (!feedback || typeof feedback !== "string") {
      return res.status(400).json({ error: "Thiếu nội dung phản hồi." });
    }

    // --- Tạo object phản hồi chuẩn hóa ---
    const entry = {
      question: question || null,
      answer: answer || null,
      feedback: feedback.trim(),
      model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
      ip: userIp,
      timestamp: new Date().toISOString(),
    };

    // --- Lưu local (backup) ---
    try {
      fs.mkdirSync(path.dirname(feedbackPath), { recursive: true });

      // Đọc file cũ an toàn (nếu có)
      let list = [];
      if (fs.existsSync(feedbackPath)) {
        const data = fs.readFileSync(feedbackPath, "utf-8");
        try {
          list = JSON.parse(data) || [];
        } catch {
          console.warn("[feedback] ⚠️ feedback.json lỗi JSON, tạo mới.");
        }
      }

      // Thêm bản ghi mới
      list.push(entry);

      // Ghi file an toàn (overwrite toàn bộ list)
      fs.writeFileSync(feedbackPath, JSON.stringify(list, null, 2));
      console.log(`[feedback] 💾 Lưu local feedback (${userIp})`);
    } catch (err) {
      console.error("[feedback] ❌ Lỗi lưu local:", err.message);
    }

    // --- Lưu Firestore nếu có ---
    if (db) {
      try {
        await db.collection("feedbacks").add(entry);
        console.log("[feedback] ☁️ Lưu feedback lên Firestore thành công.");
      } catch (err) {
        console.error("[feedback] ⚠️ Lỗi lưu Firestore:", err.message);
      }
    }

    // --- Trả phản hồi về client ---
    res
      .status(200)
      .json({ message: "✅ Cảm ơn phản hồi của bạn 💬", saved: true });
  } catch (err) {
    console.error("[feedback] 💥 Lỗi ghi nhận phản hồi:", err.message);
    res.status(500).json({ error: "Không thể lưu phản hồi." });
  }
}

