import { useState } from "react";

export default function AuthModal({ isOpen, onClose, mode = "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [authMode, setAuthMode] = useState(mode);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auth failed");
      setMessage("✅ Thành công!");
      setTimeout(onClose, 1000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-center">
          {authMode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mb-3 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full border p-2 mb-4 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
        >
          {loading ? "Đang xử lý..." : authMode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>

        <p
          className="text-sm text-center text-gray-600 mt-3 cursor-pointer hover:underline"
          onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
        >
          {authMode === "login"
            ? "Chưa có tài khoản? Đăng ký"
            : "Đã có tài khoản? Đăng nhập"}
        </p>

        {message && <p className="text-center mt-3">{message}</p>}

        <button onClick={onClose} className="absolute top-3 right-4 text-gray-500 text-xl">
          ✕
        </button>
      </div>
    </div>
  );
}

