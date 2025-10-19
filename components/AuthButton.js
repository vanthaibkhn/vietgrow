import { useState } from "react";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700"
      >
        Đăng nhập / Đăng ký
      </button>
      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}

