// pages/api/auth/register.js
// ✅ Server-safe: dùng Firestore Admin SDK (từ lib/firebase.js)
// Không dùng firebase/auth (client-side)
import { db } from "@/lib/firebase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Thiếu email hoặc mật khẩu." });
  }

  try {
    console.log("[API:register] 🚀 Đăng ký tài khoản:", email);

    // 🔹 Tạo UID giả định (mock)
    const uid = `local_${Buffer.from(email).toString("hex")}_${Date.now()}`;

    // 🔹 Ghi user vào Firestore
    await db.collection("users").doc(uid).set({
      email,
      createdAt: new Date(),
      freeQuotaUsed: 0,
      lastResetDate: new Date().toISOString().slice(0, 10),
    });

    console.log("[API:register] ✅ User tạo thành công:", uid);
    return res.status(200).json({
      message: "User registered successfully (mock)",
      uid,
      email,
    });
  } catch (err) {
    console.error("[API:register] 💥 Lỗi đăng ký:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

