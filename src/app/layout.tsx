import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ChatDigest - AI WhatsApp Group Chat Summarizer & Copilot",
  description:
    "Transform thousands of unread WhatsApp group messages into crystal-clear executive summaries, action items, key decisions, and grounded AI Q&A with exact citations.",
  keywords: [
    "WhatsApp summarizer",
    "chat summary AI",
    "group chat analyzer",
    "Gemini AI",
    "chat digest",
    "conversation intelligence",
  ],
  authors: [{ name: "ChatDigest Team" }],
  openGraph: {
    title: "ChatDigest - AI WhatsApp Group Chat Summarizer",
    description:
      "Turn chaotic WhatsApp group chats into structured insights and grounded Q&A.",
    type: "website",
    locale: "en_US",
    siteName: "ChatDigest",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatDigest - AI WhatsApp Group Chat Summarizer",
    description:
      "Transform long WhatsApp chats into clear executive summaries and action items in seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased min-h-screen bg-white text-slate-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
