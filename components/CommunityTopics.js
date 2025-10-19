// components/CommunityTopics.js
import { useEffect, useState } from "react";

export default function CommunityTopics() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => setTopics(data.topics || []))
      .catch(() => setTopics([]));
  }, []);

  if (!topics.length)
    return <p className="text-gray-400 italic">Chưa có chủ đề nổi bật tuần này 🌱</p>;

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">🔥 Chủ đề cộng đồng nổi bật</h2>
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

