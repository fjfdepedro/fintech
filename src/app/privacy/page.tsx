import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Header } from "@/components/header"

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto p-6">
      <Header />
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2024</p>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, information we obtain automatically when you visit our website, and information from third-party sources in accordance with applicable law.</p>

          <h2>2. Use of Information</h2>
          <p>We use the information we collect to operate our business and provide you with our services, to communicate with you, to improve our services, and to comply with our legal obligations.</p>

          <h2>3. Information Sharing</h2>
          <p>We do not share your personal information with third parties except as described in this privacy policy or with your consent.</p>

          <h2>4. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against accidental or unlawful destruction, loss, alteration, and unauthorized disclosure or access.</p>

          <h2>5. Cookies and Similar Technologies</h2>
          <p>We use cookies and similar tracking technologies to track activity on our website and to hold certain information to improve and analyze our service.</p>

          <h2>6. Your Rights</h2>
          <p>You have certain rights regarding your personal information, including the right to access, correct, or delete personal information we hold about you.</p>

          <h2>7. Children's Privacy</h2>
          <p>Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>

          <h2>8. Changes to This Privacy Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page.</p>

          <h2>9. Contact Us</h2>
          <p>If you have any questions about this privacy policy, please contact us through the provided contact information on our website.</p>
        </CardContent>
      </Card>
    </div>
  )
} 