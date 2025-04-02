import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Header } from "@/components/header"

export default function TermsOfService() {
  return (
    <div className="container mx-auto p-6">
      <Header />
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2024</p>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>

          <h2>2. Use License</h2>
          <p>Permission is granted to temporarily access the materials (information or software) on this website for personal, non-commercial transitory viewing only.</p>

          <h2>3. Disclaimer</h2>
          <p>The materials on this website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

          <h2>4. Limitations</h2>
          <p>In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this website.</p>

          <h2>5. Accuracy of Materials</h2>
          <p>The materials appearing on this website could include technical, typographical, or photographic errors. We do not warrant that any of the materials on this website are accurate, complete, or current.</p>

          <h2>6. Links</h2>
          <p>We have not reviewed all of the sites linked to this website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site.</p>

          <h2>7. Modifications</h2>
          <p>We may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</p>

          <h2>8. Governing Law</h2>
          <p>These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
        </CardContent>
      </Card>
    </div>
  )
} 