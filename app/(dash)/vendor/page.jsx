import AIChatPage from "../../components/AIChatPage";

export const metadata = { title: "Vendor Dashboard" };

export default function VendorDash() {
  return (
    <div className="min-h-screen p-6 bg-neutral-900">
      <AIChatPage role="vendor" header="Vendor Console" />
    </div>
  );
}
