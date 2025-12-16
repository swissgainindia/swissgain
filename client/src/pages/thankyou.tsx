import React from "react";
import { CheckCircle } from "lucide-react";

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

        {/* Extra Info */}
        <p className="text-sm text-gray-500 mb-6">
          If you have any questions, feel free to contact our support team.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/"
            className="w-full inline-flex justify-center items-center rounded-lg bg-black text-white px-5 py-3 text-sm font-medium hover:bg-gray-800 transition"
          >
            Go to Home
          </a>

          <a
            href="/orders"
            className="w-full inline-flex justify-center items-center rounded-lg border border-gray-300 text-gray-700 px-5 py-3 text-sm font-medium hover:bg-gray-100 transition"
          >
            View Orders
          </a>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
