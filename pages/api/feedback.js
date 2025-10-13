import fs from "fs";
import path from "path";

const feedbackPath = path.join(process.cwd(), "data/feedback.json");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { feedback } = req.body;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  try {
    const entry = {
      feedback,
      ip,
      time: new Date().toISOString(),
    };

    let list = [];
    if (fs.existsSync(feedbackPath)) {
      list = JSON.parse(fs.readFileSync(feedbackPath, "utf-8"));
    }

    list.push(entry);
    fs.mkdirSync(path.dirname(feedbackPath), { recursive: true });
    fs.writeFileSync(feedbackPath, JSON.stringify(list, null, 2));

    res.status(200).json({ message: "Cảm ơn phản hồi của bạn 💬" });
  } catch (err) {
    console.error("Lỗi lưu phản hồi:", err);
    res.status(500).json({ error: "Không thể lưu phản hồi." });
  }
}

