"use client";
import { useRouter } from "next/navigation";
export default function BackButton() {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className="px-3 py-1.5 rounded-xl border text-sm hover:bg-gray-50">
      ← Back
    </button>
  );
}
