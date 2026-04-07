import "./globals.css";

export const metadata = {
  title: "CloserFlow AI",
  description: "AI-powered lead capture, CRM, automation, booking, and attribution platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
