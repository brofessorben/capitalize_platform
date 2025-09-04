import AIChatPage from "../../components/AIChatPage";

export const metadata = { title: "Host Dashboard" };

export default function HostDash() {
  return (
    <div className="min-h-screen p-6 bg-neutral-900">
      <AIChatPage role="host" header="Host Console" />
    </div>
  );
}
