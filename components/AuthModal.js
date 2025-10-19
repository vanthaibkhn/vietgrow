"use client";
import { useState, useEffect } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function AuthModal({ onClose, onSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Log thông tin debug khi modal mount
  useEffect(() => {
    console.group("[AuthModal] Mounted");
    console.log("Is client:", typeof window !== "undefined");
    console.groupEnd();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { app } = await getFirebaseClient();
      if (!app?.options) {
        throw new Error("Firebase app not initialized");
      }

      const auth = getAuth(app);
      let userCred;

      if (isLogin) {
        userCred = await signInWithEmailAndPassword(auth, email, password);
        console.log("[AuthModal] ✅ Login success:", userCred.user.uid);
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
        console.log("[AuthModal] ✅ Registration success:", userCred.user.uid);
      }

      const user = userCred.user;
      localStorage.setItem("vietgrow_uid", user.uid);
      onSuccess?.(user);
      onClose?.();
    } catch (err) {
      console.error("[AuthModal] 💥 Error:", err.code, err.message);
      const code = err?.code || "unknown";

      // Giao diện lỗi thân thiện
      const messages = {
        "auth/email-already-in-use":
          "Email này đã được đăng ký. Vui lòng đăng nhập thay vì tạo mới.",
        "auth/invalid-email": "Địa chỉ email không hợp lệ.",
        "auth/weak-password": "Mật khẩu quá yếu (tối thiểu 6 ký tự).",
        "auth/user-not-found":
          "Không tìm thấy tài khoản. Hãy đăng ký trước khi đăng nhập.",
        "auth/wrong-password": "Sai mật khẩu. Vui lòng thử lại.",
        "auth/network-request-failed":
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra Internet.",
        "auth/configuration-not-found":
          "Cấu hình Firebase chưa đúng. Kiểm tra lại .env.local.",
      };
      setError(messages[code] || "Đăng nhập hoặc đăng ký thất bại. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-all">
      <div className="bg-white w-96 rounded-2xl shadow-xl p-8 relative animate-fadeIn">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-lg"
        >
          ✕
        </button>

        {/* Tiêu đề */}
        <h2 className="text-2xl font-bold mb-5 text-center text-green-700">
          {isLogin ? "Đăng nhập vào VietGrow 🌱" : "Tạo tài khoản mới 🌿"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none transition"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none transition"
              required
            />
          </div>

          {/* Hiển thị lỗi rõ ràng */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Nút submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-medium py-2 rounded-lg transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading
              ? "⏳ Đang xử lý..."
              : isLogin
              ? "Đăng nhập"
              : "Tạo tài khoản"}
          </button>
        </form>

        {/* Đổi chế độ */}
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-medium hover:underline"
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-4">
          © 2025 VietGrow – AI cộng đồng học hỏi Việt Nam
        </p>
      </div>
    </div>
  );
}

