export default function AnswerCard({ answer }) {
  return (
    <div className="border rounded-xl p-4 bg-gray-50 shadow-sm">
      <h2 className="font-semibold text-gray-700 mb-2">🤖 Trả lời:</h2>
      <p className="text-gray-800 whitespace-pre-line">{answer}</p>
    </div>
  );
}

