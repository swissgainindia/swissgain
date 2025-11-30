import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Mail, User, CreditCard, Truck, ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Protecting your privacy is our commitment at Swiggain
          </p>
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <Shield className="h-4 w-4 mr-1" />
            Last updated: December 1, 2024
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to <strong>Swiggain Jewels Pvt. Ltd.</strong> ("we", "our", "us"). We are committed to 
                protecting your privacy and ensuring the security of your personal information. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you visit our website 
                www.swiggain.com or purchase our jewelry products.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                By using our website, you consent to the data practices described in this policy. If you do not 
                agree with the terms of this Privacy Policy, please do not access the website.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="h-5 w-5 text-blue-600 mr-2" />
                  Personal Information
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Contact Details:</strong> Name, email address, phone number, shipping address</li>
                  <li><strong>Account Information:</strong> Username, password, profile preferences</li>
                  <li><strong>Payment Information:</strong> Billing address, payment method details (processed securely through payment gateways)</li>
                  <li><strong>Order Details:</strong> Purchase history, product preferences, wishlist items</li>
                  <li><strong>Communication Records:</strong> Customer service inquiries, feedback, reviews</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <Eye className="h-5 w-5 text-blue-600 mr-2" />
                  Automatically Collected Information
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
                  <li><strong>Usage Data:</strong> Pages visited, time spent on site, click patterns, referring URLs</li>
                  <li><strong>Location Data:</strong> General location based on IP address for regional compliance</li>
                  <li><strong>Cookies & Tracking:</strong> Session cookies, persistent cookies, analytics data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                  Sensitive Information
                </h3>
                <p className="text-gray-700 mb-3">
                  We do not store sensitive payment information like credit card numbers or CVV codes. 
                  All payment processing is handled by PCI-DSS compliant third-party payment gateways.
                </p>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>To process and fulfill your jewelry orders and deliver products</li>
                <li>To manage your account and provide customer support</li>
                <li>To personalize your shopping experience and recommend products</li>
                <li>To send order confirmations, shipping updates, and delivery notifications</li>
                <li>To process payments and prevent fraudulent transactions</li>
                <li>To communicate about promotions, new collections, and special offers (with your consent)</li>
                <li>To improve our website, products, and customer service</li>
                <li>To comply with legal obligations and prevent illegal activities</li>
                <li>To conduct market research and analyze shopping trends</li>
              </ul>
            </section>

            {/* Legal Basis for Processing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Legal Basis for Processing</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We process your personal information based on the following legal grounds:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Contractual Necessity:</strong> To fulfill our obligations under sales contracts</li>
                <li><strong>Legal Compliance:</strong> To meet our legal and regulatory requirements</li>
                <li><strong>Legitimate Interests:</strong> To operate and improve our business while respecting your rights</li>
                <li><strong>Consent:</strong> For marketing communications and certain data processing activities</li>
              </ul>
            </section>

            {/* Information Sharing & Disclosure */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing & Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information in the following circumstances:
              </p>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Service Providers</h4>
                  <p className="text-blue-700">
                    Trusted partners who assist in website operation, payment processing, shipping, 
                    and customer service. All service providers are bound by strict data protection agreements.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Legal Requirements</h4>
                  <p className="text-blue-700">
                    When required by law, court order, or governmental regulations, we may disclose 
                    information to comply with legal processes.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Business Transfers</h4>
                  <p className="text-blue-700">
                    In connection with any merger, sale of company assets, or acquisition, customer 
                    information may be transferred to the new owners.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Security & Fraud Prevention</h4>
                  <p className="text-blue-700">
                    To protect against fraud, unauthorized transactions, claims, or other liabilities.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium">
                  We implement comprehensive security measures to protect your personal information.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>SSL encryption for all data transmissions</li>
                <li>Secure servers with regular security updates</li>
                <li>PCI-DSS compliance for payment processing</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Limited employee access to personal data</li>
                <li>Data anonymization where possible</li>
                <li>Secure data backup and recovery procedures</li>
              </ul>
              <p className="text-gray-700 mt-4">
                While we implement robust security measures, no method of transmission over the Internet 
                or electronic storage is 100% secure. We cannot guarantee absolute security but we strive 
                to use commercially acceptable means to protect your personal information.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We retain your personal information only for as long as necessary to fulfill the purposes 
                outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> Retained while your account is active or as needed to provide services</li>
                <li><strong>Order Records:</strong> 7 years for tax and business record purposes</li>
                <li><strong>Marketing Data:</strong> Until consent is withdrawn or account is deleted</li>
                <li><strong>Customer Service Records:</strong> 3 years for quality and training purposes</li>
                <li><strong>Inactive Accounts:</strong> Deleted after 2 years of inactivity</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Access & Portability</h4>
                  <p className="text-gray-700 text-sm">
                    Request access to and copies of your personal data in a structured format
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Correction</h4>
                  <p className="text-gray-700 text-sm">
                    Request correction of inaccurate or incomplete personal information
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Deletion</h4>
                  <p className="text-gray-700 text-sm">
                    Request deletion of your personal data under certain circumstances
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Restriction</h4>
                  <p className="text-gray-700 text-sm">
                    Request restriction of processing your personal data
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Objection</h4>
                  <p className="text-gray-700 text-sm">
                    Object to processing of your personal data for direct marketing
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Withdraw Consent</h4>
                  <p className="text-gray-700 text-sm">
                    Withdraw previously given consent at any time
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:privacy@swiggain.com" className="text-blue-600 hover:underline">
                  privacy@swiggain.com
                </a>
              </p>
            </section>

            {/* Cookies & Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies & Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your browsing experience 
                and analyze website traffic.
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800">Essential Cookies</h4>
                  <p className="text-gray-700 text-sm">
                    Required for basic website functionality and cannot be disabled
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Analytics Cookies</h4>
                  <p className="text-gray-700 text-sm">
                    Help us understand how visitors interact with our website
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Marketing Cookies</h4>
                  <p className="text-gray-700 text-sm">
                    Used to deliver relevant advertisements and track campaign performance
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Preference Cookies</h4>
                  <p className="text-gray-700 text-sm">
                    Remember your settings and preferences for future visits
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mt-4">
                You can control cookie settings through your browser preferences. However, 
                disabling cookies may affect your ability to use certain features of our website.
              </p>
            </section>

            {/* Third-Party Links */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed">
                Our website may contain links to third-party websites. This Privacy Policy applies 
                only to our website. We are not responsible for the privacy practices or content of 
                third-party sites. We encourage you to review the privacy policies of any third-party 
                sites you visit.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our website is not intended for children under 18 years of age. We do not knowingly 
                collect personal information from children under 18. If you are a parent or guardian 
                and believe your child has provided us with personal information, please contact us 
                immediately. If we become aware that we have collected personal information from a child 
                under 18, we will take steps to delete such information.
              </p>
            </section>

            {/* International Data Transfers */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your personal information may be transferred to and processed in countries other than 
                your country of residence. These countries may have data protection laws that are 
                different from the laws of your country. We ensure appropriate safeguards are in place 
                to protect your personal information in accordance with this Privacy Policy.
              </p>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices 
                or legal requirements. We will notify you of any material changes by posting the new 
                Privacy Policy on this page and updating the "Last Updated" date. We encourage you to 
                review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-blue-50 rounded-lg p-6 mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Contact Us</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-3 inline-flex">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Privacy Team</h3>
                  <p className="text-gray-700">privacy@swiggain.com</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-3 inline-flex">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Data Protection Officer</h3>
                  <p className="text-gray-700">dpo@swiggain.com</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-gray-700">
                  <strong>Swiggain Jewels Pvt. Ltd.</strong><br />
                  123 Jewelers Street, Zaveri Bazaar<br />
                  Mumbai, Maharashtra - 400002<br />
                  India
                </p>
              </div>
            </section>

            {/* Legal Disclaimer */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm text-center">
                <strong>Note:</strong> This Privacy Policy is compliant with Indian data protection laws 
                and international privacy standards. For questions about your privacy rights or data 
                practices, please contact our Privacy Team.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/terms">
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              Terms & Conditions
            </Button>
          </Link>
          <Link href="/return-policy">
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              Return Policy
            </Button>
          </Link>
          <Link href="/cookie-policy">
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              Cookie Policy
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;