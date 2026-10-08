import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { SileoProvider } from "@/components/sileo-provider";
import "./globals.css";
import { ReactNode } from "react";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const SITE_URL = "https://converteasy.astralsolutions.tech";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Convert Easy | Privacy-First File Converter (Video, Audio, PDF & Docs)",
    template: "%s | Convert Easy",
  },
  description:
    "Convert video (MP4, MKV, WebM), audio (MP3, WAV, FLAC), documents (DOCX, PDF, Markdown), and images online for free with privacy. No accounts needed, no files stored.",
  keywords: [
    "convert easy",
    "convert mp4 to mp4",
    "free file converter",
    "video converter online",
    "mp4 converter",
    "audio converter",
    "docx to pdf",
    "pdf tools online",
    "organize pdf",
    "image to base64",
    "privacy file conversion",
    "faststart mp4",
    "offline file converter",
  ],
  authors: [{ name: "Convert Easy Team" }],
  creator: "Convert Easy",
  publisher: "Convert Easy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Convert Easy",
    title: "Convert Easy | Privacy-First File Converter (Video, Audio, PDF & Docs)",
    description:
      "Convert video (MP4, MKV, WebM), audio (MP3, WAV, FLAC), documents (DOCX, PDF, Markdown), and images online for free with privacy. No accounts needed, no files stored.",
    images: [
      {
        url: "/og-image-1200.jpg",
        width: 1200,
        height: 630,
        alt: "Convert Easy - Privacy-First File Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Convert Easy | Privacy-First File Converter",
    description:
      "Convert video, audio, PDF, documents, and images with absolute privacy. No accounts needed, no files stored.",
    images: ["/og-image-1200.jpg"],
  },
  manifest: "/favicon/manifest.json",
  other: {
    "msapplication-config": "/favicon/browserconfig.xml",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon.ico", sizes: "any" },
    ],
    apple: [
      {
        url: "/favicon/apple-icon-57x57.png",
        sizes: "57x57",
        type: "image/png",
      },
      {
        url: "/favicon/apple-icon-60x60.png",
        sizes: "60x60",
        type: "image/png",
      },
      {
        url: "/favicon/apple-icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        url: "/favicon/apple-icon-76x76.png",
        sizes: "76x76",
        type: "image/png",
      },
      {
        url: "/favicon/apple-icon-114x114.png",
        sizes: "114x114",
        type: "image/png",
      },
      {
        url: "/favicon/apple-icon-120x120.png",
        sizes: "120x120",
        type: "image/png",
      },
      {
        url: "/favicon/apple-icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        url: "/favicon/apple-icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        url: "/favicon/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/favicon/apple-icon-precomposed.png",
      },
    ],
  },
};

import { StructuredData } from "@/components/structured-data";

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          themes={["light", "dark", "blue"]}
          disableTransitionOnChange
        >
          {children}
          <SileoProvider />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
