export default function FeedbackButtons() {
  const sendFeedback = async (type) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: type }),
    });
    alert("Cảm ơn bạn đã phản hồi 💬");
  };

  return (
    <div className="flex justify-center gap-4 mt-4">
      <button
        onClick={() => sendFeedback("helpful")}
        className="bg-green-100 hover:bg-green-200 text-green-700 py-1 px-3 rounded-lg"
      >
        👍 Hữu ích
      </button>
      <button
        onClick={() => sendFeedback("not_helpful")}
        className="bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded-lg"
      >
        👎 Không hữu ích
      </button>
    </div>
  );
}

