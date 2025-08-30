"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ label = "Back" }) {
  const r = useRouter();
  return (
    <button
      onClick={() => r.back()}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border hover:bg-gray-50 transition"
      type="button"
    >
      ← {label}
    </button>
  );
}
