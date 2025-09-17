import "./globals.css";

export const metadata = {
  title: "CAPITALIZE",
  description: "Referral-driven marketplace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-white antialiased">
        {/* GLOBAL BACKGROUND (same vibe as homepage) */}
        <div className="fixed inset-0 -z-10">
          {/* deep space base */}
          <div className="absolute inset-0 bg-[#0b0a14]" />
          {/* nebula gradients */}
          <div className="absolute inset-0 mix-blend-screen opacity-70 [background:radial-gradient(70%_60%_at_50%_0%,rgba(173,76,255,0.28),transparent),radial-gradient(60%_50%_at_80%_20%,rgba(255,92,159,0.22),transparent),radial-gradient(70%_60%_at_20%_80%,rgba(46,186,255,0.22),transparent)]" />
          {/* tiny star speckle */}
          <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(white_1px,transparent_1.5px)] [background-size:3px_3px]" />
          {/* soft vignette */}
          <div className="absolute inset-0 pointer-events-none [background:radial-gradient(120%_90%_at_50%_10%,transparent,rgba(0,0,0,0.65))]" />
        </div>

        {/* page content above background */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
