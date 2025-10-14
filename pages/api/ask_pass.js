import OpenAI from "openai";
import { checkLimit } from "../../lib/rateLimiter";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // Kiểm tra giới hạn 3 câu hỏi/ngày
  const allowed = await checkLimit(ip);
  if (!allowed) {
    return res.status(429).json({
      error: "limit_exceeded",
      message:
        "Bạn đã vượt quá 3 câu hỏi miễn phí hôm nay. Vui lòng đăng ký tài khoản để tiếp tục.",
    });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Thiếu nội dung câu hỏi." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Bạn là AI hỗ trợ học hỏi cộng đồng VietGrow — trả lời ngắn gọn, dễ hiểu, hữu ích cho người Việt.",
        },
        { role: "user", content: question },
      ],
    });

    const answer = completion.choices[0].message.content;
    res.status(200).json({ answer });
  } catch (err) {
    console.error("Lỗi gọi OpenAI:", err);
    res.status(500).json({ error: "Lỗi server khi gọi OpenAI API." });
  }
}

