"use client"; // ✅ BẮT BUỘC: render ở client-side

// components/AuthModal.js
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

  // ✅ Log khi component render lần đầu
  useEffect(() => {
    console.group("[DEBUG][AuthModal] Component mounted");
    console.log("Is client:", typeof window !== "undefined");
    console.log("Environment variables snapshot:", {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    });
    console.groupEnd();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.group("[DEBUG][AuthModal] handleSubmit");
      console.log("Mode:", isLogin ? "Login" : "Register");
      console.log("Email:", email);

      const { app } = await getFirebaseClient();
      if (!app?.options) {
        console.error(
          "[AuthModal] ❌ Firebase app not initialized. Check getFirebaseClient()."
        );
        throw new Error("Firebase app not initialized");
      }

      console.log("[AuthModal] 🔑 Firebase App Info:", {
        name: app.name,
        projectId: app.options?.projectId,
      });

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
      console.group("[DEBUG][AuthModal] Error Trace");
      console.error("[AuthModal] 💥 Full error object:", err);
      console.log("Error code:", err?.code || "unknown");
      console.log("Error message:", err?.message);
      console.groupEnd();

      const code = err?.code || "unknown";
      if (code === "auth/email-already-in-use") {
        setError("Email này đã được đăng ký, vui lòng đăng nhập.");
      } else if (code === "auth/invalid-email") {
        setError("Địa chỉ email không hợp lệ.");
      } else if (code === "auth/weak-password") {
        setError("Mật khẩu quá yếu (tối thiểu 6 ký tự).");
      } else if (code === "auth/user-not-found") {
        setError("Không tìm thấy tài khoản, vui lòng đăng ký mới.");
      } else if (code === "auth/wrong-password") {
        setError("Sai mật khẩu, vui lòng thử lại.");
      } else if (code === "auth/network-request-failed") {
        setError("Không thể kết nối tới Firebase. Kiểm tra Internet.");
      } else if (code === "auth/configuration-not-found") {
        setError("Cấu hình Firebase chưa được khởi tạo đúng. Kiểm tra .env.local.");
      } else {
        setError("Đăng nhập hoặc đăng ký thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      console.log("[DEBUG][AuthModal] Done processing form.");
      console.groupEnd();
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white w-80 rounded-2xl shadow-lg p-6 animate-fadeIn">
        <h2 className="text-2xl font-semibold mb-4 text-center text-green-700">
          {isLogin ? "Đăng nhập" : "Đăng ký"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="input w-full border rounded p-2 mb-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="input w-full border rounded p-2 mb-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="text-red-600 text-sm mb-2 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
          >
            {loading
              ? "Đang xử lý..."
              : isLogin
              ? "Đăng nhập"
              : "Tạo tài khoản"}
          </button>
        </form>

        <div className="text-center mt-4">
          <p
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:underline cursor-pointer"
          >
            {isLogin
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </p>
          <button
            onClick={onClose}
            className="mt-4 text-xs text-gray-500 hover:text-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

