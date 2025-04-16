import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export function SiteFooter() {
  // Usar una fecha fija basada en el tiempo de build
  const buildDate = new Date()
  
  return (
    <footer className="mt-12 py-8 border-t border-border">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:underline">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/gdpr" className="hover:underline">
                  GDPR Compliance
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Disclaimer</h3>
            <p className="text-sm text-muted-foreground">
              The information provided on this site is for informational purposes only and should not be considered financial advice. 
              Crypto investments are volatile and high-risk. Always conduct your own research before making any investment decisions.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Data Sources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Last updated: {formatDate(buildDate)}</li>
              <li>All times shown in GMT</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {buildDate.getFullYear()} Crypto Market Insights. All rights reserved.</p>
            <p>Made with ❤️ for the crypto community</p>
          </div>
        </div>
      </div>
    </footer>
  )
} 