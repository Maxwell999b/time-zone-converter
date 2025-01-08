import type { Metadata } from "next";

import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quote Application",
  description:
    "The Quote Generator is a web application that provides users with random quotes based on selected categories. Users can generate a new quote by clicking a button.",
  keywords: ["Quote", "React", "TypeScript", "Multiple Category", "happiness"],
  authors: [{ name: "Maxwell999b" }],
  creator: "Maxwell999b",
  publisher: "Quote Application",
  metadataBase: new URL("https://timezone-converterg.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://timezone-converterg.vercel.app",
    title: "React Quote Application",
    description:
      "Get random quotes to match your vibe. Start your day with a spark of inspiration that's uniquely yours!",
    siteName: "React Quote Application",
    images: [
      {
        url: "https://timezone-converterg.vercel.app/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "React Quote Application",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "React Quote Application",
    description:
      "Get random quotes to match your vibe. Start your day with a spark of inspiration that's uniquely yours!",
    images: ["https://timezone-converterg.vercel.app/android-chrome-512x512.png"],
    creator: "@Maxwell999b",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", type: "image/png" },
      { url: "/favicon-16x16.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
    shortcut: ["/favicon-16x16.png"],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
