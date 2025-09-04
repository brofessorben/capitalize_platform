import AIChatPage from "../../components/AIChatPage";

export const metadata = { title: "Referrer Dashboard" };

export default function ReferrerDash() {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <AIChatPage role="referrer" header="Referrer Console" />
    </div>
  );
}
