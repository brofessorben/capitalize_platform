import BackButton from "@/app/components/BackButton";

export default function ReferrerDash() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referrer Dashboard</h1>
        <BackButton />
      </div>
      {/* form / content here */}
    </div>
  );
}
