import "./globals.css";

export const metadata = {
  title: "CAPITALIZE",
  description: "Referral-driven marketplace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
