'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-3 text-gray-900">
          Thank You for Your Purchase! 🎉
        </h1>

        <p className="text-gray-600 mb-6">
          Your payment was successful and your order has been placed.
        </p>

        {/* Order ID */}
        {orderId && (
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Order ID</p>
            <p className="font-mono text-sm text-gray-800 break-all">
              {orderId}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
          <Package className="h-4 w-4" />
          <span>Your order is being processed and will be shipped soon.</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/">
            <Button className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </Link>

          <Link href="/products">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-400 mt-6">
          If you have any questions, contact our support team.
        </p>
      </div>
    </div>
  );
}
