// pages/index.js
import { useState, useEffect } from "react";
import QuestionForm from "../components/QuestionForm";
import AnswerCard from "../components/AnswerCard";
import FeedbackButtons from "../components/FeedbackButtons";
import AuthModal from "../components/AuthModal";

// 🔥 Hiển thị chủ đề cộng đồng nổi bật
function CommunityTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch("/api/topics");
        const data = await res.json();
        setTopics(data.topics || []);
      } catch (err) {
        console.error("[CommunityTopics] 💥 Lỗi khi tải topics:", err.message);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  if (loading)
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 mt-6 text-gray-500 text-center">
        Đang tải chủ đề cộng đồng...
      </div>
    );

  if (!topics.length)
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 mt-6 text-gray-400 italic text-center">
        Chưa có chủ đề nổi bật tuần này 🌱
      </div>
    );

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">
        🔥 Chủ đề cộng đồng nổi bật
      </h2>
      <ul className="list-disc ml-5 space-y-2">
        {topics.map((t, i) => (
          <li key={i}>
            <span className="font-medium">{t.title}</span>{" "}
            <span className="text-gray-500 text-sm">
              ({t.questionCount} câu hỏi, mức quan tâm {t.popularity})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 🤖 Hiển thị nội dung “AI học được gì từ cộng đồng tuần này”
function WeeklyLearning() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch("/api/learning/latest");
        const data = await res.json();
        setSummary(data.summary || "");
      } catch (err) {
        console.error("[WeeklyLearning] 💥 Lỗi khi tải summary:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading)
    return (
      <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mt-8 text-gray-500 text-center">
        Đang tổng hợp kiến thức cộng đồng...
      </div>
    );

  if (!summary) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-8">
      <h3 className="text-lg font-semibold text-green-700 mb-2">
        🤖 AI học được gì từ cộng đồng tuần này
      </h3>
      <p className="text-gray-800 whitespace-pre-line">{summary}</p>
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [uid, setUid] = useState(null);

  // ✅ Đọc UID từ localStorage khi load trang
  useEffect(() => {
    const savedUid = localStorage.getItem("vietgrow_uid");
    if (savedUid) setUid(savedUid);
  }, []);

  const askAI = async () => {
    if (!question.trim()) return alert("Vui lòng nhập câu hỏi!");
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, uid }), // ✅ gửi kèm UID
      });

      const data = await res.json();

      if (data.error === "limit_exceeded") {
        setError(data.message);
      } else if (res.ok) {
        setAnswer(data.answer);
      } else {
        setError("Đã có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (err) {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vietgrow_uid");
    setUid(null);
    alert("Đã đăng xuất!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            VietGrow 🌱 – AI cộng đồng học hỏi
          </h1>
          {uid ? (
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Đăng xuất
            </button>
          ) : null}
        </div>

        {/* Ô hỏi đáp chính */}
        <QuestionForm
          question={question}
          setQuestion={setQuestion}
          askAI={askAI}
          loading={loading}
        />

        {/* Hiển thị lỗi (vd: quá quota, server lỗi, v.v.) */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 mt-4 rounded-lg text-center">
            <p>{error}</p>
            {error.includes("vượt quá 3 câu hỏi") && (
              <button
                onClick={() => setShowAuth(true)}
                className="mt-2 underline text-blue-600 hover:text-blue-800"
              >
                Đăng nhập / Đăng ký để tiếp tục
              </button>
            )}
          </div>
        )}

        {/* Câu trả lời của AI */}
        {answer && (
          <div className="mt-6">
            <AnswerCard answer={answer} />
            <FeedbackButtons />
          </div>
        )}

        {/* 🔥 Chủ đề cộng đồng nổi bật */}
        <CommunityTopics />

        {/* 🤖 AI học được gì từ cộng đồng tuần này */}
        <WeeklyLearning />
      </div>

      <footer className="text-gray-400 text-sm mt-4 text-center">
        © 2025 VietGrow – AI học từ cộng đồng Việt Nam
      </footer>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(user) => {
            localStorage.setItem("vietgrow_uid", user.uid);
            setUid(user.uid);
            setShowAuth(false);
            alert("Đăng nhập thành công! Bạn có thể hỏi tiếp.");
          }}
        />
      )}
    </div>
  );
}

