import AIChatPage from "../../components/AIChatPage";

export const metadata = { title: "Host Dashboard" };

export default function HostDash() {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <AIChatPage header="Host Console" />
    </div>
  );
}
