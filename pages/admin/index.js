// pages/admin/index.js
// ✅ VietGrow Admin Dashboard — xem dữ liệu câu hỏi, phản hồi và chủ đề cộng đồng
import { useEffect, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubQ = null,
      unsubF = null,
      unsubT = null;

    async function loadData() {
      try {
        const { db } = await getFirebaseClient();

        // 🔹 Cấu hình query: sắp theo createdAt giảm dần (nếu có)
        const qQuestions = query(collection(db, "questions"), orderBy("createdAt", "desc"));
        const qFeedback = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
        const qTopics = query(collection(db, "topics"), orderBy("createdAt", "desc"));

        // 🔹 Dùng onSnapshot để realtime update
        unsubQ = onSnapshot(qQuestions, (snap) => {
          setQuestions(snap.docs.map((d) => d.data()));
        });
        unsubF = onSnapshot(qFeedback, (snap) => {
          setFeedback(snap.docs.map((d) => d.data()));
        });
        unsubT = onSnapshot(qTopics, (snap) => {
          setTopics(snap.docs.map((d) => d.data()));
        });
      } catch (err) {
        console.error("[AdminDashboard] 💥 Firestore error:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // cleanup snapshot khi rời trang
    return () => {
      if (unsubQ) unsubQ();
      if (unsubF) unsubF();
      if (unsubT) unsubT();
    };
  }, []);

  if (loading)
    return (
      <div className="p-6 text-center text-gray-500">
        Đang tải dữ liệu quản trị...
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-600">
        Lỗi khi tải dữ liệu: {error}
      </div>
    );

  return (
    <div className="p-6 max-w-6xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-6">🌿 VietGrow Admin Dashboard</h1>

      <DashboardSection
        title="📘 Questions"
        items={questions}
        renderItem={(q) => (
          <>
            <p className="font-medium">{q.question}</p>
            <p className="text-sm text-gray-500">{q.answer}</p>
          </>
        )}
      />

      <DashboardSection
        title="💬 Feedback"
        items={feedback}
        renderItem={(f) => (
          <>
            <p>
              <strong>{f.rating}</strong> — {f.note || "Không có ghi chú"}
            </p>
            <p className="text-xs text-gray-400">{f.createdAt}</p>
          </>
        )}
      />

      <DashboardSection
        title="🧠 Topics"
        items={topics}
        renderItem={(t) => (
          <>
            <p className="font-medium">{t.title}</p>
            <p className="text-sm text-gray-500">
              {t.questionCount} câu hỏi — tạo lúc {t.createdAt}
            </p>
          </>
        )}
      />
    </div>
  );
}

function DashboardSection({ title, items, renderItem }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">
        {title} ({items.length})
      </h2>
      <div className="max-h-64 overflow-y-auto border p-3 rounded-lg bg-gray-50">
        {items.length === 0 ? (
          <p className="text-gray-400 italic text-sm">Không có dữ liệu</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="border-b py-2 last:border-none">
              {renderItem(item)}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

