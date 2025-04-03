'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from './button'
import { Card } from './card'

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookieConsent')
    if (!hasConsented) {
      setShowConsent(true)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('cookieConsent', 'all')
    setShowConsent(false)
    // Here you could enable all types of cookies
  }

  const acceptEssential = () => {
    localStorage.setItem('cookieConsent', 'essential')
    setShowConsent(false)
    // Here you would only enable essential cookies
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-3 md:p-4 bg-background/95 backdrop-blur-sm border-t">
      <div className="max-w-7xl mx-auto">
        <Card className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold">🍪 Cookie Settings</h3>
                <div className="flex gap-2 sm:hidden">
                  <Button
                    variant="outline"
                    onClick={acceptEssential}
                    className="h-7 px-2 text-xs"
                  >
                    Essential
                  </Button>
                  <Button
                    onClick={acceptAll}
                    className="h-7 px-2 text-xs"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                We use our own and third-party cookies to improve our services and show you advertising related to your preferences.
              </p>
              <div className="text-xs text-muted-foreground">
                See our{' '}
                <Link href="/cookie-policy" className="underline hover:text-primary">
                  Cookie Policy
                </Link>
                {' '}and{' '}
                <Link href="/privacy-policy" className="underline hover:text-primary">
                  Privacy Policy
                </Link>
              </div>
            </div>
            
            <div className="hidden sm:flex sm:flex-row gap-2 justify-end">
              <Button
                variant="outline"
                onClick={acceptEssential}
                className="w-auto"
              >
                Essential Only
              </Button>
              <Button
                onClick={acceptAll}
                className="w-auto"
              >
                Accept All
              </Button>
            </div>

            <div className="text-[10px] sm:text-xs text-muted-foreground border-t pt-2 mt-1">
              <p className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
                <Link href="/terms-of-service" className="hover:text-primary">
                  Terms
                </Link>
                <Link href="/legal" className="hover:text-primary">
                  Legal
                </Link>
                <Link href="/gdpr-compliance" className="hover:text-primary">
                  GDPR
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 