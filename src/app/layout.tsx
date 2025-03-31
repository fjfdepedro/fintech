import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import GoogleAnalytics from '@/components/google-analytics'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cryptotoday.click'),
  title: {
    default: "CryptoToday | Real-time Crypto Market Insights",
    template: "%s | CryptoToday"
  },
  description: "Get real-time cryptocurrency market insights, price charts, and market analysis. Track top cryptocurrencies, view price trends, and stay updated with the latest market data.",
  keywords: ["cryptocurrency", "crypto market", "market analysis", "price charts", "fintech", "crypto tracking", "market insights"],
  authors: [{ name: "CryptoToday" }],
  creator: "CryptoToday",
  publisher: "CryptoToday",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/manifest-icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.cryptotoday.click",
    title: "CryptoToday | Real-time Crypto Market Insights",
    description: "Get real-time cryptocurrency market insights, price charts, and market analysis. Track top cryptocurrencies, view price trends, and stay updated with the latest market data.",
    siteName: "CryptoToday",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CryptoToday Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoToday | Real-time Crypto Market Insights",
    description: "Get real-time cryptocurrency market insights, price charts, and market analysis. Track top cryptocurrencies, view price trends, and stay updated with the latest market data.",
    images: ["/og-image.jpg"],
    creator: "@cryptotoday",
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
    google: 'your-google-site-verification', // Add your Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
