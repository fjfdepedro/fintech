import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import GoogleAnalytics from '@/components/google-analytics'
import { AutoUpdater } from '@/components/auto-updater'
import { CookieConsent } from '@/components/ui/cookie-consent'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from "@/lib/utils";
import { fontSans } from "@/styles/fonts";

const inter = Inter({ subsets: ["latin"] });

// Add ISR configuration
export const revalidate = 3600 // Revalidate every hour

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
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/manifest-icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/favicon.ico'],
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
        type: "image/jpeg",
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
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const themeColor = [
  { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  { media: '(prefers-color-scheme: dark)', color: '#000000' }
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem
        >
          <GoogleAnalytics />
          <AutoUpdater />
          {children}
          <ThemeToggle />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
