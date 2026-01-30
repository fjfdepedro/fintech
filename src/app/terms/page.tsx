import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Header } from "@/components/header"
import { SiteFooter } from "@/components/site-footer"

export default function TermsOfService() {
  return (
    <div className="container mx-auto p-6">
      <Header />
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using Crypto Market by PacoTeam ("the Service"), including through Discord Activities, you accept and agree to be bound by these Terms of Service.</p>

          <h2>2. Description of Service</h2>
          <p>Crypto Market is a free informational service that displays real-time cryptocurrency market data, prices, and analysis. The Service is provided as a Discord Activity for entertainment and informational purposes.</p>

          <h2>3. Use License</h2>
          <p>Permission is granted to access the Service for personal, non-commercial use only. You may not:</p>
          <ul>
            <li>Use the Service in violation of Discord's Terms of Service</li>
            <li>Attempt to interfere with the Service's functionality</li>
            <li>Use automated systems to access the Service</li>
            <li>Reproduce or distribute the Service without permission</li>
          </ul>

          <h2>4. Financial Disclaimer</h2>
          <p>The information provided by this Service is for informational purposes only and should not be considered financial advice. Cryptocurrency investments are volatile and high-risk. Always conduct your own research before making any investment decisions. PacoTeam is not responsible for any financial losses.</p>

          <h2>5. Disclaimer of Warranties</h2>
          <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that the data displayed is accurate, complete, or current. Cryptocurrency prices may be delayed or inaccurate.</p>

          <h2>6. Limitation of Liability</h2>
          <p>PacoTeam shall not be liable for any damages arising from the use or inability to use the Service, including but not limited to financial losses based on information displayed.</p>

          <h2>7. Modifications</h2>
          <p>We reserve the right to modify or discontinue the Service at any time without notice. We may also update these Terms of Service from time to time.</p>

          <h2>8. Governing Law</h2>
          <p>These terms are governed by applicable laws. For disputes, the courts of Spain shall have jurisdiction.</p>

          <h2>9. Contact</h2>
          <p>For questions about these Terms, contact us through Discord.</p>
        </CardContent>
      </Card>
      <SiteFooter />
    </div>
  )
}
