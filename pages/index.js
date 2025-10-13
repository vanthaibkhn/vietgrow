import { useState } from "react";
import QuestionForm from "../components/QuestionForm";
import AnswerCard from "../components/AnswerCard";
import FeedbackButtons from "../components/FeedbackButtons";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askAI = async () => {
    if (!question.trim()) return alert("Vui lòng nhập câu hỏi!");
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          VietGrow 🌱 – AI cộng đồng học hỏi
        </h1>

        <QuestionForm
          question={question}
          setQuestion={setQuestion}
          askAI={askAI}
          loading={loading}
        />

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mt-4 rounded-lg text-center">
            {error}
          </div>
        )}

        {answer && (
          <div className="mt-6">
            <AnswerCard answer={answer} />
            <FeedbackButtons />
          </div>
        )}
      </div>

      <footer className="text-gray-400 text-sm mt-4">
        © 2025 VietGrow – AI học từ cộng đồng Việt Nam
      </footer>
    </div>
  );
}

