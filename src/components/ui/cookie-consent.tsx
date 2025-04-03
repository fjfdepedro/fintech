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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-sm border-t">
      <div className="max-w-7xl mx-auto">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">🍪 Cookie Settings</h3>
              <p className="text-sm text-muted-foreground max-w-2xl">
                We use our own and third-party cookies to improve our services and show you advertising related to your preferences through the analysis of your browsing habits. 
                You can configure or reject cookies by clicking on the corresponding buttons. 
                For more information, please check our{' '}
                <Link href="/cookie-policy" className="underline hover:text-primary">
                  Cookie Policy
                </Link>
                {' '}and our{' '}
                <Link href="/privacy-policy" className="underline hover:text-primary">
                  Privacy Policy
                </Link>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
              <Button
                variant="outline"
                onClick={acceptEssential}
                className="whitespace-nowrap"
              >
                Essential Only
              </Button>
              <Button
                onClick={acceptAll}
                className="whitespace-nowrap"
              >
                Accept All
              </Button>
            </div>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <p>
              Additional links:{' '}
              <Link href="/terms-of-service" className="underline hover:text-primary">
                Terms of Service
              </Link>
              {' '}&bull;{' '}
              <Link href="/legal" className="underline hover:text-primary">
                Legal
              </Link>
              {' '}&bull;{' '}
              <Link href="/gdpr-compliance" className="underline hover:text-primary">
                GDPR Compliance
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
} 