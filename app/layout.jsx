import "./globals.css";

export const metadata = {
  title: "CAPITALIZE",
  description: "Connect. Refer. Get Paid.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-black text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
