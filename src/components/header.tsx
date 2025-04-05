'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="sticky top-0 z-50 w-full mb-4 sm:mb-6">
      <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/10 via-[#2A2A2A]/5 to-[#4A4A4A]/10 rounded-2xl blur-xl" />
      <div className="relative flex items-center justify-between p-3 sm:p-6 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-sm border border-[#D1D5DB] dark:border-[#2A2A2A] rounded-2xl shadow-lg">
        <Link
          href="/"
          className="group flex items-center gap-2 sm:gap-4 transition-all duration-300 hover:scale-[1.02]"
        >
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
        </Link>

        <nav className="hidden sm:flex items-center gap-8">
          <a 
            href="#daily-crypto-analysis" 
            className="group relative px-4 py-2 text-lg font-medium text-[#4A4A4A] dark:text-[#D1D5DB] hover:text-[#111111] dark:hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">Daily Crypto Analysis</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#E5E5E5] to-white dark:from-[#2A2A2A] dark:to-[#111111] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-[#111111] to-[#4A4A4A] dark:from-[#E5E5E5] dark:to-[#D1D5DB] group-hover:w-full transition-all duration-300" />
          </a>
          <a 
            href="#crypto-statistics" 
            className="group relative px-4 py-2 text-lg font-medium text-[#4A4A4A] dark:text-[#D1D5DB] hover:text-[#111111] dark:hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">Crypto Statistics</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#E5E5E5] to-white dark:from-[#2A2A2A] dark:to-[#111111] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-[#111111] to-[#4A4A4A] dark:from-[#E5E5E5] dark:to-[#D1D5DB] group-hover:w-full transition-all duration-300" />
          </a>
          <a 
            href="#top-cryptos" 
            className="group relative px-4 py-2 text-lg font-medium text-[#4A4A4A] dark:text-[#D1D5DB] hover:text-[#111111] dark:hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">Top Cryptos</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#E5E5E5] to-white dark:from-[#2A2A2A] dark:to-[#111111] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-[#111111] to-[#4A4A4A] dark:from-[#E5E5E5] dark:to-[#D1D5DB] group-hover:w-full transition-all duration-300" />
          </a>
          <a 
            href="#crypto-price-charts" 
            className="group relative px-4 py-2 text-lg font-medium text-[#4A4A4A] dark:text-[#D1D5DB] hover:text-[#111111] dark:hover:text-white transition-all duration-300"
          >
            <span className="relative z-10">Crypto Price Charts</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#E5E5E5] to-white dark:from-[#2A2A2A] dark:to-[#111111] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-[#111111] to-[#4A4A4A] dark:from-[#E5E5E5] dark:to-[#D1D5DB] group-hover:w-full transition-all duration-300" />
          </a>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden p-2 text-[#4A4A4A] dark:text-[#D1D5DB]"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="absolute right-3 top-[4.5rem] w-[calc(100%-24px)] bg-white dark:bg-[#111111] rounded-xl shadow-lg border border-[#D1D5DB] dark:border-[#2A2A2A] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col divide-y divide-[#D1D5DB]/10 dark:divide-[#2A2A2A]/50">
              <a 
                href="#daily-crypto-analysis" 
                className="px-4 py-3.5 text-[15px] font-medium text-[#4A4A4A] dark:text-[#D1D5DB] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] active:bg-[#F8F9FA]/80 dark:active:bg-[#2A2A2A]/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Daily Crypto Analysis
              </a>
              <a 
                href="#crypto-statistics" 
                className="px-4 py-3.5 text-[15px] font-medium text-[#4A4A4A] dark:text-[#D1D5DB] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] active:bg-[#F8F9FA]/80 dark:active:bg-[#2A2A2A]/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Crypto Statistics
              </a>
              <a 
                href="#top-cryptos" 
                className="px-4 py-3.5 text-[15px] font-medium text-[#4A4A4A] dark:text-[#D1D5DB] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] active:bg-[#F8F9FA]/80 dark:active:bg-[#2A2A2A]/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Top Cryptos
              </a>
              <a 
                href="#crypto-price-charts" 
                className="px-4 py-3.5 text-[15px] font-medium text-[#4A4A4A] dark:text-[#D1D5DB] hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] active:bg-[#F8F9FA]/80 dark:active:bg-[#2A2A2A]/80"
                onClick={() => setIsMenuOpen(false)}
              >
                Crypto Price Charts
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 