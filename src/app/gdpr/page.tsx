import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Header } from "@/components/header"

export default function GDPRCompliance() {
  return (
    <div className="container mx-auto p-6">
      <Header />
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold">GDPR Compliance</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2024</p>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. Introduction</h2>
          <p>We are committed to protecting your personal data and complying with the General Data Protection Regulation (GDPR). This policy explains how we handle your personal data in compliance with GDPR.</p>

          <h2>2. Your Rights Under GDPR</h2>
          <p>Under GDPR, you have the following rights:</p>
          <ul>
            <li>The right to be informed</li>
            <li>The right of access</li>
            <li>The right to rectification</li>
            <li>The right to erasure</li>
            <li>The right to restrict processing</li>
            <li>The right to data portability</li>
            <li>The right to object</li>
            <li>Rights in relation to automated decision making and profiling</li>
          </ul>

          <h2>3. Legal Basis for Processing</h2>
          <p>We process personal data only when we have a legal basis to do so, including:</p>
          <ul>
            <li>Consent</li>
            <li>Contractual necessity</li>
            <li>Legal obligation</li>
            <li>Vital interests</li>
            <li>Legitimate interests</li>
          </ul>

          <h2>4. Data Protection Principles</h2>
          <p>We adhere to the following principles when processing personal data:</p>
          <ul>
            <li>Lawfulness, fairness, and transparency</li>
            <li>Purpose limitation</li>
            <li>Data minimization</li>
            <li>Accuracy</li>
            <li>Storage limitation</li>
            <li>Integrity and confidentiality</li>
            <li>Accountability</li>
          </ul>

          <h2>5. International Data Transfers</h2>
          <p>When we transfer personal data outside the EEA, we ensure appropriate safeguards are in place in accordance with GDPR requirements.</p>

          <h2>6. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk.</p>

          <h2>7. Data Breach Procedures</h2>
          <p>We have procedures in place to detect, report, and investigate personal data breaches in accordance with GDPR requirements.</p>

          <h2>8. Data Protection Officer</h2>
          <p>You can contact our Data Protection Officer for any GDPR-related queries through the contact information provided on our website.</p>

          <h2>9. Updates to This Policy</h2>
          <p>We may update this GDPR compliance policy from time to time to reflect changes in our practices or legal requirements.</p>
        </CardContent>
      </Card>
    </div>
  )
} 