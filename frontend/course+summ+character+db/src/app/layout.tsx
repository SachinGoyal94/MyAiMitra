import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Mitra — Your AI Companion",
  description:
    "Your intelligent companion for learning and creation. Chat with AI, generate courses, summarize documents, and more.",
  keywords: [
    "AI Mitra",
    "AI Assistant",
    "Course Generator",
    "Summarizer",
    "Character Chat",
    "Next.js",
  ],
  authors: [{ name: "AI Mitra" }],
  icons: {
    icon: "/favicon.svg",
  },

  openGraph: {
    title: "AI Mitra",
    description:
      "Your intelligent companion for learning and creation.",
    siteName: "AI Mitra",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Mitra",
    description:
      "Your intelligent companion for learning and creation.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
