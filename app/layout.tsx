import type { Metadata } from "next";

import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Time Zone Converter Application",
  description:
    "A Time Zone Converter that helps you easily convert times between different zones worldwide. Perfect for scheduling international meetings and events.",
  keywords: ["Time Zone", "Converter", "React", "TypeScript", "International Time", "World Clock"],
  authors: [{ name: "Maxwell999b" }],
  creator: "Maxwell999b",
  publisher: "Time Zone Converter",
  metadataBase: new URL("https://timezone-converterg.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://timezone-converterg.vercel.app",
    title: "Time Zone Converter",
    description:
      "Convert times across different time zones instantly. Perfect for coordinating across global teams and planning international events!",
    siteName: "Time Zone Converter",
    images: [
      {
        url: "https://timezone-converterg.vercel.app/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Time Zone Converter",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Time Zone Converter",
    description:
      "Convert times across different time zones instantly. Perfect for coordinating across global teams and planning international events!",
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
