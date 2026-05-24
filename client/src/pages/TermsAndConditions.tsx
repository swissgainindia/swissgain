import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, MapPin, Clock, ArrowLeft } from 'lucide-react';

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-rose-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Terms & Conditions</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Welcome to Swiggain - Your trusted destination for exquisite jewelry
          </p>
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: December 1, 2024
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-rose-600 hover:text-rose-700">
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
                Welcome to <strong>Swiggain</strong> ("we", "our", "us"). These Terms & Conditions ("Terms") 
                govern your use of our premium jewelry ecommerce website and services. By accessing or using 
                our website, purchasing our products, or engaging with our services, you agree to be bound by 
                these Terms. If you do not agree with any part of these Terms, please discontinue use of our services immediately.
              </p>
            </section>

            {/* Eligibility */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed">
                You must be at least <strong>18 years old</strong> to use our website and purchase our jewelry products. 
                By using our services, you confirm that you meet this age requirement and have the legal capacity 
                to enter into binding contracts.
              </p>
            </section>

            {/* Account Registration */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Account Registration</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You are solely responsible for maintaining the confidentiality of your account credentials and password</li>
                <li>You agree to provide accurate, current, and complete information during registration and order placement</li>
                <li>You must promptly update your information to keep it accurate and complete</li>
                <li>We reserve the right to suspend or terminate accounts that provide false information, violate these Terms, or engage in fraudulent activities</li>
                <li>Multiple accounts for the same individual are not permitted without prior written consent</li>
              </ul>
            </section>

            {/* Orders & Payments */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Orders & Payments</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>By placing an order, you agree to provide valid and authorized payment information</li>
                <li>All prices are listed in <strong>Indian Rupees (₹)</strong> and include applicable taxes unless stated otherwise</li>
                <li>We reserve the right to modify prices, discontinue products, or change product specifications without prior notice</li>
                <li>Orders are subject to acceptance and availability. We reserve the right to cancel or refuse any order at our discretion</li>
                <li>Payment processing is secured through PCI-DSS compliant payment gateways</li>
                <li>For high-value jewelry purchases, additional verification may be required</li>
              </ul>
            </section>

            {/* Shipping & Delivery */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Shipping & Delivery</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>We ship throughout India using trusted courier partners</li>
                <li>Delivery estimates are provided at checkout but are not guaranteed</li>
                <li>We are not responsible for delays caused by courier services, customs, weather conditions, or other circumstances beyond our control</li>
                <li>Signature may be required upon delivery for security purposes</li>
                <li>International shipping is available for select locations with additional charges and customs duties</li>
                <li>Risk of loss passes to you upon delivery confirmation</li>
              </ul>
            </section>

            {/* Returns & Refunds */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Returns & Refunds</h2>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4">
                <p className="text-rose-800 font-medium">
                  Important: Due to the intimate nature of jewelry products, certain restrictions apply to returns and exchanges.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Our return and refund policies are detailed on our <Link href="/return-policy" className="text-rose-600 hover:underline">Return Policy</Link> page</li>
                <li>Return requests must be made within 7 days of delivery</li>
                <li>Products must be in original condition with all tags and packaging intact</li>
                <li>Customized, personalized, or made-to-order jewelry cannot be returned or exchanged</li>
                <li>Refund eligibility depends on product type, condition, and the nature of the issue</li>
                <li>Refunds will be processed to the original payment method within 7-10 business days</li>
              </ul>
            </section>

            {/* Product Quality & Certification */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Product Quality & Certification</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>All gold jewelry is certified for purity as per BIS standards</li>
                <li>Diamonds and precious stones are accompanied by authentic certification from recognized laboratories</li>
                <li>Product images are for representation purposes; actual products may vary slightly</li>
                <li>We provide detailed product specifications, including carat weight, metal purity, and stone quality</li>
                <li>Hallmarking is provided on all eligible gold jewelry as per government regulations</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>All content on our website, including logos, text, images, product designs, and product listings, is the exclusive property of Swiggain</li>
                <li>Our jewelry designs are protected by copyright and design patent laws</li>
                <li>Unauthorized reproduction, distribution, or commercial use of our content is strictly prohibited</li>
                <li>The "Swiggain" name and logo are registered trademarks</li>
                <li>You may not use our intellectual property for any purpose without express written permission</li>
              </ul>
            </section>

            {/* Prohibited Activities */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Prohibited Activities</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Using the website for any unlawful, fraudulent, or malicious purposes</li>
                <li>Attempting to gain unauthorized access to our systems, user accounts, or data</li>
                <li>Copying, reselling, or commercially exploiting website content without permission</li>
                <li>Placing fraudulent orders or using stolen payment information</li>
                <li>Reverse engineering, decompiling, or disassembling any website technology</li>
                <li>Engaging in any activity that could damage, disable, or impair our website's functionality</li>
                <li>Using automated systems or bots to access our services without permission</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Swiggain shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or services</li>
                <li>Our total liability for any claim related to your purchase shall not exceed the purchase price of the product</li>
                <li>We are not responsible for any loss or damage to jewelry after delivery confirmation</li>
                <li>Your use of the website and products is at your own risk</li>
                <li>We do not guarantee that the website will be error-free or uninterrupted</li>
              </ul>
            </section>

            {/* Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your privacy is important to us. Your use of our website is also governed by our 
                <Link href="/privacy-policy" className="text-rose-600 hover:underline mx-1">Privacy Policy</Link>, 
                which explains how we collect, use, and protect your personal information.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate your access to our website at any time, without prior notice, 
                if you violate these Terms, engage in fraudulent activities, or for any other reason at our 
                sole discretion. Upon termination, your right to use our website will immediately cease.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to update or modify these Terms at any time. Changes will be effective 
                immediately upon posting on this page. We will notify registered users of material changes 
                via email. Your continued use of our services after any changes constitutes acceptance of 
                the revised Terms.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India. 
                Any disputes arising from these Terms or your use of our services shall be subject to 
                the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-gray-50 rounded-lg p-6 mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Contact Us</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="bg-rose-100 p-3 rounded-full mb-3">
                    <Mail className="h-6 w-6 text-rose-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-700">legal@swiggain.com</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-rose-100 p-3 rounded-full mb-3">
                    <MapPin className="h-6 w-6 text-rose-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                  <p className="text-gray-700">
                    Swiggain Jewels Pvt. Ltd.<br />
                    123 Jewelers Street<br />
                    Zaveri Bazaar, Mumbai<br />
                    Maharashtra - 400002
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-rose-100 p-3 rounded-full mb-3">
                    <Shield className="h-6 w-6 text-rose-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Legal Hours</h3>
                  <p className="text-gray-700">
                    Mon - Fri: 10AM - 6PM<br />
                    Closed on Public Holidays
                  </p>
                </div>
              </div>
            </section>

            {/* Legal Disclaimer */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm text-center">
                <strong>Disclaimer:</strong> These Terms & Conditions are legally binding. 
                While we strive for accuracy, this document does not constitute legal advice. 
                Please consult with a qualified legal professional for specific legal guidance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/privacy-policy">
            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
              Privacy Policy
            </Button>
          </Link>
          <Link href="/return-policy">
            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
              Return Policy
            </Button>
          </Link>
          <Link href="/shipping-policy">
            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
              Shipping Policy
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;