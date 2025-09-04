import AIChatPage from "../../components/AIChatPage";

export const metadata = { title: "Vendor Dashboard" };

export default function VendorDash() {
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <AIChatPage header="Vendor Console" />
    </div>
  );
}
