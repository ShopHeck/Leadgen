import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CloserFlow AI — Turn Every Lead Into a Booked Appointment",
  description:
    "AI-powered lead capture, instant follow-up, CRM pipeline, and booking automation for service businesses. Respond to leads in under 60 seconds.",
  openGraph: {
    title: "CloserFlow AI — Turn Every Lead Into a Booked Appointment",
    description:
      "AI-powered lead capture, instant follow-up, CRM pipeline, and booking automation for service businesses.",
    url: "https://closer-flow.com",
    siteName: "CloserFlow AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CloserFlow AI — Turn Every Lead Into a Booked Appointment",
    description:
      "AI-powered lead capture, instant follow-up, CRM pipeline, and booking automation for service businesses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
