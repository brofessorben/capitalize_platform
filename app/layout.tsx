import "./globals.css";

export const metadata = {
  title: "CAPITALIZE",
  description: "Referral-driven marketplace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          color: "white",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          margin: 0,
        }}
      >
        {/* GLOBAL BACKGROUND (homepage look) */}
        <div style={{ position: "fixed", inset: 0, zIndex: -10 }}>
          <div style={{ position: "absolute", inset: 0, background: "#0b0a14" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              mixBlendMode: "screen",
              opacity: 0.7,
              background:
                "radial-gradient(70% 60% at 50% 0%, rgba(173,76,255,0.28), transparent)," +
                "radial-gradient(60% 50% at 80% 20%, rgba(255,92,159,0.22), transparent)," +
                "radial-gradient(70% 60% at 20% 80%, rgba(46,186,255,0.22), transparent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.15,
              backgroundImage: "radial-gradient(white 1px, transparent 1.5px)",
              backgroundSize: "3px 3px",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(120% 90% at 50% 10%, transparent, rgba(0,0,0,0.65))",
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 10 }}>{children}</div>
      </body>
    </html>
  );
}
