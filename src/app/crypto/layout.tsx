import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { fontSans } from "@/styles/fonts"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: {
    template: '%s | Crypto Market Insights',
    default: 'Crypto Market Insights',
  },
  description: "Detailed cryptocurrency market data, including price charts, market statistics, and on-chain metrics.",
}

export default function CryptoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn('min-h-screen bg-background font-sans antialiased flex flex-col', fontSans.variable)}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem
        disableTransitionOnChange
      >
        {/* Header */}
        <header className="sticky top-0 z-50 w-full mb-4 sm:mb-6">
          <div className="container">
            <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/10 via-[#2A2A2A]/5 to-[#4A4A4A]/10 rounded-2xl blur-xl" />
            <div className="relative flex items-center justify-between p-3 sm:p-6 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-sm border border-[#D1D5DB] dark:border-[#2A2A2A] rounded-2xl shadow-lg">
              <Link href="/" className="group flex items-center gap-2 sm:gap-4 transition-all duration-300 hover:scale-[1.02]">
                <div className="relative flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#111111] via-[#2A2A2A] to-[#4A4A4A] shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 sm:h-6 sm:w-6 text-[#E5E5E5]"
                    aria-hidden="true"
                  >
                    <path d="M2 2v20h20" />
                    <path d="M6 16l3-8 4 2 3-6 4 12" />
                  </svg>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#111111] to-[#4A4A4A] dark:from-white dark:to-[#D1D5DB] bg-clip-text text-transparent">
                    Crypto Market
                  </h1>
                  <p className="text-xs sm:text-sm text-[#4A4A4A] dark:text-[#D1D5DB] hidden sm:block">
                    Real-time crypto market analysis
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="ml-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <SiteFooter />
      </ThemeProvider>
    </div>
  )
} 