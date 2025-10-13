export default function QuestionForm({ question, setQuestion, askAI, loading }) {
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Nhập câu hỏi của bạn..."
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 min-h-[100px]"
      />
      <button
        onClick={askAI}
        disabled={loading}
        className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-300"
      >
        {loading ? "Đang hỏi AI..." : "Hỏi AI"}
      </button>
    </div>
  );
}

