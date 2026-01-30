import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto p-6">
      <Header />
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Introduction</h2>
          <p>Crypto Market by PacoTeam ("we", "our", or "the Service") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our Discord Activity.</p>

          <h2>2. Information We Collect</h2>
          <p>Crypto Market is designed with privacy in mind. We collect minimal information:</p>
          <ul>
            <li><strong>No personal data:</strong> We do not collect, store, or process any personal information.</li>
            <li><strong>No account data:</strong> We do not access your Discord account information.</li>
            <li><strong>No tracking:</strong> We do not use cookies, analytics, or tracking technologies.</li>
          </ul>

          <h2>3. How the Service Works</h2>
          <p>Crypto Market displays real-time cryptocurrency data fetched from public APIs. The data shown (prices, market caps, etc.) comes from third-party sources like CoinGecko and CoinMarketCap. We do not store any user-specific data.</p>

          <h2>4. Third-Party Services</h2>
          <p>The Service runs within Discord's platform and is subject to <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">Discord's Privacy Policy</a>. We use third-party APIs for cryptocurrency data:</p>
          <ul>
            <li>CoinGecko API</li>
            <li>CoinMarketCap API</li>
          </ul>
          <p>These services have their own privacy policies.</p>

          <h2>5. Data Storage</h2>
          <p>We do not store any user data. The cryptocurrency data displayed is cached temporarily on our servers to improve performance, but no personal information is associated with this data.</p>

          <h2>6. Children's Privacy</h2>
          <p>Our Service is not directed to children under 13. We do not knowingly collect any information from anyone, including children.</p>

          <h2>7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>

          <h2>8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, you can contact us through Discord.</p>
        </CardContent>
      </Card>
      <SiteFooter />
    </div>
  )
}
