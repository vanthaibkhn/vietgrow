// pages/api/ask.js
// ✅ Endpoint chính: nhận câu hỏi, kiểm tra quota, gọi AI pipeline
import { aiService } from "../../services/aiService.js";
import { rateLimitService } from "../../services/rateLimitService.js";
import { authService } from "../../services/authService.js";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { question, uid } = req.body;
  const ipHeader = req.headers["x-forwarded-for"];
  const userIp = ipHeader ? ipHeader.split(",")[0].trim() : req.socket.remoteAddress;

  try {
    console.log("[ask.js] ▶️ Handler called | uid:", uid, "| IP:", userIp);

    // 1️⃣ Xác thực & lấy thông tin người dùng nếu có
    let userData = null;
    if (uid) {
      console.log("[ask.js] 🔍 Lấy thông tin user từ Firestore...");
      userData = await authService.getUser(uid);
    }

    // 2️⃣ Kiểm tra quota / rate-limit
    console.log("[ask.js] 🚦 Running rate limit check...");
    await rateLimitService.check(userIp, userData);
    console.log("[ask.js] ✅ Rate limit passed, tiếp tục gọi AI...");

    // 3️⃣ Gọi pipeline xử lý câu hỏi
    const result = await aiService.processQuestion({ question, userIp, uid });

    // 4️⃣ Trả kết quả về client
    res.status(200).json(result);
    console.log("[ask.js] ✅ Response sent successfully");
  } catch (err) {
    console.error("[ask.js] 💥 Error caught:", err?.message || err);
    if (err.message === "limit_exceeded") {
      console.warn("[ask.js] ❌ Free quota exceeded");
      return res.status(429).json({
        error: "limit_exceeded",
        message:
          "Bạn đã vượt quá 3 câu hỏi miễn phí hôm nay. Vui lòng đăng nhập hoặc đợi đến ngày mai.",
      });
    }
    res.status(500).json({
      error: "internal_error",
      message: err?.message || String(err),
    });
  }
}

