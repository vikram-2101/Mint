import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatDigest - WhatsApp Group Chat Summarizer",
  description:
    "AI-powered structured summaries and grounded Q&A for WhatsApp group chats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
