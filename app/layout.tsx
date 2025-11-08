import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getConfig } from "./lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate dynamic metadata based on ranker type
const config = getConfig();
const rankerType = process.env.NEXT_PUBLIC_RANKER_TYPE || 'vc';

export const metadata: Metadata = {
  title: config.title,
  description: `Vote and rank the best ${config.entityNamePlural} based on community preferences. Compare ${config.entityNamePlural} head-to-head and see real-time ELO rankings.`,
  keywords: [
    config.entityNamePlural,
    'ranking',
    'voting',
    'ELO rating',
    'comparison',
    rankerType === 'vc' ? 'venture capital' : rankerType === 'ib' ? 'investment banking' : 'hedge funds',
    'finance',
  ],
  authors: [{ name: 'Corporate Ranker' }],
  creator: 'Corporate Ranker',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    siteName: config.title,
    title: config.title,
    description: `Vote and rank the best ${config.entityNamePlural}. Community-driven ELO rankings.`,
    images: [
      {
        url: '/og-image.png', // You'll need to add this image
        width: 1200,
        height: 630,
        alt: `${config.title} - Community Rankings`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.title,
    description: `Vote and rank the best ${config.entityNamePlural}`,
    images: ['/og-image.png'], // Same as OG image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these if you have them:
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}