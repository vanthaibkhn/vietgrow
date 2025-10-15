// pages/api/auth/login.js
// ✅ Server-safe: đọc thông tin user từ Firestore, không gọi firebase/auth client
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
    console.log("[API:login] 🚀 Đăng nhập với email:", email);

    // 🔹 Tìm user trong Firestore (theo email)
    const snapshot = await db.collection("users").where("email", "==", email).get();

    if (snapshot.empty) {
      console.warn("[API:login] ⚠️ Không tìm thấy user:", email);
      return res.status(404).json({ error: "Tài khoản không tồn tại. Vui lòng đăng ký trước." });
    }

    // 🔹 Lấy user đầu tiên (vì Firestore where có thể trả nhiều)
    const doc = snapshot.docs[0];
    const userData = doc.data();

    // ⚠️ Chưa có xác thực mật khẩu thật (vì chưa dùng Firebase Auth)
    // => Ở giai đoạn này, chỉ xác minh email tồn tại (mock login)
    console.log("[API:login] ✅ Đăng nhập thành công:", doc.id);

    return res.status(200).json({
      message: "Login success (mock)",
      uid: doc.id,
      email: userData.email,
    });
  } catch (err) {
    console.error("[API:login] 💥 Lỗi đăng nhập:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

