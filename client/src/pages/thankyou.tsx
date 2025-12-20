import React from "react";
import { CheckCircle, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const ThankYou: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Thank You for Your Order!
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Your order has been placed successfully.  
          We’ll notify you once it’s shipped.
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Buttons */}
        <div className="space-y-3 mb-6">
          <Button asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/order">
              <ShoppingBag className="mr-2 h-4 w-4" />
              View Orders
            </Link>
          </Button>
        </div>

        {/* Extra Info */}
        <p className="text-sm text-gray-500">
          If you have any questions, feel free to contact our support team.
        </p>

       
      </div>
    </div>
  );
};

export default ThankYou;