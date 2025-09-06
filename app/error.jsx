"use client";

export default function GlobalError({ error, reset }) {
  console.error("App crashed:", error);

  return (
    <html>
      <body className="bg-black text-white flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold mb-4">💥 Something broke.</h2>
        <p className="mb-6 text-gray-400">
          Don’t stress — even the best rockets blow up sometimes.
        </p>
        <button
          onClick={() => reset()}
          className="bg-red-600 px-4 py-2 rounded text-white font-semibold"
        >
          Retry
        </button>
      </body>
    </html>
  );
}
