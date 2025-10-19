// pages/api/topics.js
// ✅ Trả về danh sách chủ đề cộng đồng nổi bật nhất tuần
import { db } from "@/lib/firebase.js";
import fs from "fs/promises";
import path from "path";

const TOPIC_FILE = path.join(process.cwd(), "data/topics.json");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let topics = [];

    // 🔹 Ưu tiên đọc từ Firestore nếu có
    if (db) {
      const snap = await db
        .collection("topics")
        .orderBy("popularity", "desc")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      topics = snap.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        questionCount: doc.data().questionCount,
        popularity: doc.data().popularity || 0,
        createdAt: doc.data().createdAt,
        samples: doc.data().samples || [],
      }));
    }

    // 🔹 Fallback local nếu Firestore không sẵn sàng
    if (!topics.length) {
      console.warn("[topics] ⚠️ Firestore unavailable, fallback to local topics.json");
      const raw = await fs.readFile(TOPIC_FILE, "utf-8").catch(() => "[]");
      const all = JSON.parse(raw);
      topics = all
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 5);
    }

    console.log(`[topics] ✅ Returned ${topics.length} topics.`);
    res.status(200).json({ topics });
  } catch (err) {
    console.error("[topics] 💥 Error:", err.message);
    res.status(500).json({ error: "Không thể lấy danh sách chủ đề." });
  }
}

