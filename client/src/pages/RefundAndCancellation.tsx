import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, X, Check, Clock, Truck, CreditCard, Mail, Phone, ArrowLeft, AlertCircle } from 'lucide-react';

const RefundAndCancellation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <RefreshCw className="h-8 w-8 text-emerald-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Refund & Cancellation Policy</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Clear and transparent policies for your jewelry purchases
          </p>
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: December 1, 2024
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Important Notice */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Important Notice</h3>
              <p className="text-amber-700">
                Due to the intimate nature and high value of jewelry products, certain restrictions apply to 
                returns and refunds. Please read this policy carefully before making a purchase.
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                At <strong>Swiggain Jewels Pvt. Ltd.</strong>, we strive to ensure complete customer satisfaction. 
                This Refund & Cancellation Policy outlines the terms and conditions governing returns, refunds, 
                and cancellations for purchases made on our website.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                By placing an order with Swiggain, you acknowledge that you have read, understood, 
                and agree to be bound by this policy.
              </p>
            </section>

            {/* Order Cancellation */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Order Cancellation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                  <div className="flex items-center mb-3">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-800">Before Shipping</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                    <li>Cancellation available within 12 hours of order placement</li>
                    <li>Full refund processed within 3-5 business days</li>
                    <li>No cancellation fees applied</li>
                    <li>Instant cancellation for pending payments</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                  <div className="flex items-center mb-3">
                    <X className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold text-red-800">After Shipping</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                    <li>Cancellation not possible once order is shipped</li>
                    <li>You may refuse delivery when courier arrives</li>
                    <li>Return process will be initiated upon delivery refusal</li>
                    <li>Return shipping charges may apply</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">How to Cancel Your Order</h4>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                  <li>Login to your Swiggain account</li>
                  <li>Go to "My Orders" section</li>
                  <li>Select the order you wish to cancel</li>
                  <li>Click "Cancel Order" button</li>
                  <li>Confirm cancellation request</li>
                </ol>
                <p className="text-blue-700 text-sm mt-2">
                  Alternatively, contact our customer support at <strong>support@swiggain.com</strong> 
                  or call <strong>+91-XXXXXX-XXXX</strong>
                </p>
              </div>
            </section>

            {/* Return Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Return Policy</h2>

              {/* Return Timeframe */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Return Timeframe</h3>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-emerald-600 mr-2" />
                      <span className="font-semibold text-emerald-800">7-Day Return Window</span>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      From delivery date
                    </Badge>
                  </div>
                  <p className="text-emerald-700 text-sm mt-2">
                    Return requests must be initiated within 7 days of product delivery
                  </p>
                </div>
              </div>

              {/* Eligible Returns */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Eligible for Return</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Defective Products</span>
                    </div>
                    <p className="text-green-700 text-sm">Manufacturing defects or quality issues</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Wrong Item Received</span>
                    </div>
                    <p className="text-green-700 text-sm">Different from what was ordered</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Size Issues</span>
                    </div>
                    <p className="text-green-700 text-sm">Rings with size mismatch (conditions apply)</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Damaged in Transit</span>
                    </div>
                    <p className="text-green-700 text-sm">Visible damage from shipping</p>
                  </div>
                </div>
              </div>

              {/* Non-Returnable Items */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Non-Returnable Items</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <X className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-800">Customized Jewelry</span>
                        <p className="text-red-700 text-sm">Made-to-order or personalized items</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <X className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-800">Earrings</span>
                        <p className="text-red-700 text-sm">For hygiene and intimate wear reasons</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <X className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-800">Sale/Discounted Items</span>
                        <p className="text-red-700 text-sm">Clearance or special offer products</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <X className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-800">Used/Altered Items</span>
                        <p className="text-red-700 text-sm">Products showing signs of wear or alteration</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Conditions */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Return Conditions</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 bg-gray-50 p-4 rounded-lg">
                  <li>Original tags and packaging must be intact</li>
                  <li>All certificates (BIS, diamond, etc.) must be returned</li>
                  <li>Product should be in original, unused condition</li>
                  <li>Security seals must not be broken or tampered with</li>
                  <li>Return request must include clear photos/videos of the issue</li>
                </ul>
              </div>
            </section>

            {/* Refund Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Refund Policy</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-800 mb-1">Refund Method</h4>
                  <p className="text-blue-700 text-sm">Original payment method</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800 mb-1">Processing Time</h4>
                  <p className="text-green-700 text-sm">7-10 business days</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                  <Check className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-purple-800 mb-1">Refund Amount</h4>
                  <p className="text-purple-700 text-sm">100% product value*</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-800 mb-2">*Deductions & Exceptions</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                  <li>Shipping charges are non-refundable</li>
                  <li>Customs duties and taxes for international returns are non-refundable</li>
                  <li>Return shipping charges may be deducted for non-defective returns</li>
                  <li>Gift wrapping charges are non-refundable</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Refund Process Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Return Request Approval</span>
                    <Badge variant="outline">1-2 business days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Product Pickup/Return</span>
                    <Badge variant="outline">2-3 business days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Quality Check at Warehouse</span>
                    <Badge variant="outline">2-3 business days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Refund Processing</span>
                    <Badge variant="outline">3-5 business days</Badge>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                    <span className="font-semibold text-gray-800">Total Estimated Time</span>
                    <Badge className="bg-emerald-100 text-emerald-800">7-10 business days</Badge>
                  </div>
                </div>
              </div>
            </section>

            {/* Exchange Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Exchange Policy</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-3">Size Exchange</h3>
                  <ul className="list-disc list-inside space-y-2 text-indigo-700">
                    <li>Available for rings within 7 days of delivery</li>
                    <li>One-time size exchange per order</li>
                    <li>Subject to size availability</li>
                    <li>Shipping charges apply for exchange</li>
                  </ul>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-teal-800 mb-3">Product Exchange</h3>
                  <ul className="list-disc list-inside space-y-2 text-teal-700">
                    <li>Exchange for different product of equal or higher value</li>
                    <li>Price difference to be paid for higher value products</li>
                    <li>Subject to product availability</li>
                    <li>Original product must meet return conditions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How to Initiate Return */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How to Initiate Return/Refund</h2>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Contact Support</h4>
                    <p className="text-gray-600 text-sm">
                      Email us at support@swiggain.com or call our helpline
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Provide Details</h4>
                    <p className="text-gray-600 text-sm">
                      Share order details and reason for return with photos
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Follow Instructions</h4>
                    <p className="text-gray-600 text-sm">
                      We'll guide you through pickup or return process
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-emerald-50 rounded-lg p-6 mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Need Help?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="bg-emerald-100 p-3 rounded-full mb-3 inline-flex">
                    <Mail className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
                  <p className="text-gray-700">support@swiggain.com</p>
                  <p className="text-gray-600 text-sm mt-1">Response within 24 hours</p>
                </div>
                <div className="text-center">
                  <div className="bg-emerald-100 p-3 rounded-full mb-3 inline-flex">
                    <Phone className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
                  <p className="text-gray-700">+91-XXXXXX-XXXX</p>
                  <p className="text-gray-600 text-sm mt-1">Mon-Sat: 10AM-7PM</p>
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
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm text-center">
                <strong>Note:</strong> This policy is subject to change without prior notice. 
                For the most current version, please check our website regularly. 
                In case of disputes, the decision of Swiggain management will be final.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/terms">
            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              Terms & Conditions
            </Button>
          </Link>
          <Link href="/privacy-policy">
            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              Privacy Policy
            </Button>
          </Link>
          <Link href="/shipping-policy">
            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              Shipping Policy
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RefundAndCancellation;