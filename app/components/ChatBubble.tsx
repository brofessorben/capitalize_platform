export default function ChatBubble({ sender, text }) {
  const isAI = sender === "ai";
  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`px-4 py-2 rounded-lg max-w-xs ${
          isAI ? "bg-gray-300 text-black" : "bg-blue-500 text-white"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
