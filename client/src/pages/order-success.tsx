import React, { useState } from "react";
import { CheckCircle, ArrowLeft, ShoppingBag, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const OrderSuccess: React.FC = () => {
  const { isLoggedIn, login } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converted, setConverted] = useState(false);

  // Get order ID from URL query parameters (orderId or order fallback)
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId') || params.get('order') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast({
        title: "Missing Order Details",
        description: "We couldn't locate your order ID. Please check your email confirmation.",
        variant: "destructive"
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/users/convert-guest', { orderId, password });
      
      // Update global auth state with returned user details
      if (res.data && res.data.token && res.data.user) {
        login({
          id: res.data.user.id,
          userId: res.data.user.id,
          username: res.data.user.username,
          email: res.data.user.email,
          role: res.data.user.role
        });
      }

      setConverted(true);
      toast({
        title: "Account Created! 🎉",
        description: "Your guest account has been successfully upgraded to a registered user.",
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to create account. Please try again.";
      toast({
        title: "Conversion Failed",
        description: errMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Main Order Confirmation Card */}
        <Card className="border-slate-200/80 shadow-xl bg-white/80 backdrop-blur-md overflow-hidden rounded-2xl">
          <CardContent className="p-8 text-center space-y-6">
            {/* Pulsing Green Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                <CheckCircle className="relative w-20 h-20 text-green-500 bg-white rounded-full p-1" />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Order Placed!
              </h1>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">
                Thank you for your purchase. Your order has been placed successfully and is being processed.
              </p>
            </div>

            {/* Order Details badge */}
            {orderId && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/50 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full">
                Order Reference: {orderId}
              </div>
            )}

            <div className="border-t border-dashed border-slate-200 my-6"></div>

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild className="gradient-gold hover:opacity-90 text-accent-foreground font-semibold py-2.5 rounded-xl transition-all duration-300">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-200 hover:bg-slate-50 hover:text-slate-900 font-semibold py-2.5 rounded-xl transition-all duration-300">
                <Link href="/order">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View Orders
                </Link>
              </Button>
            </div>

            {/* Support Message */}
            <p className="text-xs text-slate-400 font-medium">
              A confirmation email has been sent. If you have questions, contact support.
            </p>
          </CardContent>
        </Card>

        {/* Post-Purchase Guest Account Conversion Card */}
        {orderId && !isLoggedIn && !converted && (
          <Card className="border-amber-200 bg-amber-500/[0.02] shadow-lg rounded-2xl overflow-hidden border-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-amber-500/5 border-b border-amber-200/30 p-6">
              <CardTitle className="text-base font-bold text-amber-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                Track Order & Unlock Rewards!
              </CardTitle>
              <CardDescription className="text-amber-800 text-xs leading-relaxed mt-1">
                Save your order details and join our affiliate rewards program simply by setting a password. We'll automatically use the contact details from your order.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block text-left">Choose Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10 border-slate-200 focus:border-amber-500 focus:ring-amber-500/10 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Save Details & Create Account
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Success Feedback Card after Conversion */}
        {converted && (
          <Card className="border-green-200 bg-green-500/[0.02] shadow-lg rounded-2xl overflow-hidden border-2 animate-in zoom-in-95 duration-500">
            <CardContent className="p-6 text-center space-y-4">
              <div className="inline-flex p-3 bg-green-100 rounded-full text-green-600">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-green-900">Account Created Successfully!</h3>
                <p className="text-green-800 text-xs leading-relaxed max-w-sm mx-auto">
                  You can now track your orders, view payments, and access our premium affiliate dashboard right away.
                </p>
              </div>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-300">
                <Link href="/order">
                  Go to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default OrderSuccess;
