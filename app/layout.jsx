export const metadata = {
  title: "CAPITALIZE",
  description: "Connect. Refer. Get Paid.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
