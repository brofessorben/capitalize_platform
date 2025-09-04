// app/(dash)/vendor/page.jsx
import AIChatPage from "@/app/components/AIChatPage";

export default function VendorDash() {
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Vendor Console</h1>
      <AIChatPage role="vendor" />
    </div>
  );
}
