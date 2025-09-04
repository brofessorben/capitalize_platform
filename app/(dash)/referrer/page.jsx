// app/(dash)/referrer/page.jsx
import AIChatPage from "../../components/AIChatPage";

export default function ReferrerDash() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Referrer Console</h1>
      <AIChatPage role="referrer" />
    </div>
  );
}
