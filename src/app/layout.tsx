import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatDigest - WhatsApp Group Chat Summarizer",
  description: "AI-powered structured summaries for large WhatsApp group chats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
