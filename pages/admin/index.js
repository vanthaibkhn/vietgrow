// pages/admin/index.js
// ✅ Firestore Dashboard xem dữ liệu VietGrow
import { useEffect, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    async function loadData() {
      const { db } = await getFirebaseClient();
      const qSnap = await (await import("firebase/firestore")).getDocs(
        (await import("firebase/firestore")).collection(db, "questions")
      );
      const fSnap = await (await import("firebase/firestore")).getDocs(
        (await import("firebase/firestore")).collection(db, "feedback")
      );
      const tSnap = await (await import("firebase/firestore")).getDocs(
        (await import("firebase/firestore")).collection(db, "topics")
      );

      setQuestions(qSnap.docs.map((d) => d.data()));
      setFeedback(fSnap.docs.map((d) => d.data()));
      setTopics(tSnap.docs.map((d) => d.data()));
    }

    loadData().catch((err) => console.error("[AdminDashboard] 💥", err.message));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-6">🌿 VietGrow Admin Dashboard</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">📘 Questions ({questions.length})</h2>
        <div className="max-h-64 overflow-y-auto border p-3 rounded-lg bg-gray-50">
          {questions.map((q, i) => (
            <div key={i} className="border-b py-2">
              <p className="font-medium">{q.question}</p>
              <p className="text-sm text-gray-500">{q.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">💬 Feedback ({feedback.length})</h2>
        <div className="max-h-64 overflow-y-auto border p-3 rounded-lg bg-gray-50">
          {feedback.map((f, i) => (
            <div key={i} className="border-b py-2">
              <p>
                <strong>{f.rating}</strong> — {f.note || "Không có ghi chú"}
              </p>
              <p className="text-xs text-gray-400">{f.createdAt}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">🧠 Topics ({topics.length})</h2>
        <div className="max-h-64 overflow-y-auto border p-3 rounded-lg bg-gray-50">
          {topics.map((t, i) => (
            <div key={i} className="border-b py-2">
[O              <p className="font-medium">{t.title}</p>
              <p className="text-sm text-gray-500">
                {t.questionCount} câu hỏi — tạo lúc {t.createdAt}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

