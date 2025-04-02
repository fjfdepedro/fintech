import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Header } from "@/components/header"

export default function CookiePolicy() {
  return (
    <div className="container mx-auto p-6">
      <Header />
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: April 2024</p>
        </CardHeader>
        <CardContent className="prose prose-slate dark:prose-invert max-w-none">
          <h2>1. What Are Cookies</h2>
          <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide useful information to website owners.</p>

          <h2>2. How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul>
            <li>Essential cookies: Required for the website to function properly</li>
            <li>Performance cookies: Help us understand how visitors interact with our website</li>
            <li>Functionality cookies: Remember your preferences and settings</li>
            <li>Analytics cookies: Help us improve our website and services</li>
          </ul>

          <h2>3. Types of Cookies We Use</h2>
          <h3>Essential Cookies</h3>
          <p>These cookies are necessary for the website to function and cannot be switched off in our systems.</p>

          <h3>Performance Cookies</h3>
          <p>These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.</p>

          <h3>Functionality Cookies</h3>
          <p>These cookies enable the website to provide enhanced functionality and personalization.</p>

          <h2>4. Managing Cookies</h2>
          <p>Most web browsers allow you to control cookies through their settings preferences. However, limiting cookies may impact your experience of the website.</p>

          <h2>5. Third-Party Cookies</h2>
          <p>We may use third-party services that use cookies. These cookies are governed by the respective privacy policies of these third parties.</p>

          <h2>6. Changes to This Cookie Policy</h2>
          <p>We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page.</p>

          <h2>7. Contact Us</h2>
          <p>If you have any questions about our Cookie Policy, you can contact us through the provided contact information on our website.</p>
        </CardContent>
      </Card>
    </div>
  )
} 