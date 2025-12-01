'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  TrendingUp,
  Users,
  Check,
  Handshake,
  Award,
  Target,
  BarChart3,
  Info,
  CreditCard,
  LogIn,
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth, findUserByCredentials } from './../lib/auth';

// Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
  authDomain: "swissgain-a2589.firebaseapp.com",
  databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
  projectId: "swissgain-a2589",
  storageBucket: "swissgain-a2589.firebasestorage.app",
  messagingSenderId: "1062016445247",
  appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a",
  measurementId: "G-VTKPWVEY0S"
};

let app: any, database: any;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (e: any) {
  if (e.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'AffiliateApp');
    database = getDatabase(app);
  }
}

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  key_id: "rzp_live_RjxoVsUGVyJUhQ",
  key_secret: "shF22XqtflD64nRd2GdzCYoT",
};

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Cookie helpers
const getCookie = (name: string) => {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};

export default function Affiliate() {
  const { toast } = useToast();
  const { isLoggedIn, userData, isAffiliate, login, checkAuth } = useAuth();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [userDetails, setUserDetails] = useState({ name: '', email: '', phone: '' });
  const [loginCreds, setLoginCreds] = useState({ email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [referrerName, setReferrerName] = useState('');
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  /* ---------- Initialize User ID ---------- */
  useEffect(() => {
    let uid = getCookie('swissgain_uid');
    if (!uid) {
      uid = 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      document.cookie = `swissgain_uid=${uid};path=/;max-age=31536000`;
    }
    setUserId(uid);
    
    // Load Razorpay script
    loadRazorpayScript().then((loaded) => {
      setRazorpayLoaded(!!loaded);
    });
  }, []);

  /* ---------- Check for referral parameter ---------- */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
   
    if (refCode) {
      fetchReferrer(refCode);
    }
  }, []);

  /* ---------- Fetch referrer details ---------- */
  const fetchReferrer = async (refCode: string) => {
    try {
      const affiliatesRef = ref(database, 'affiliates');
      const snap = await get(affiliatesRef);
     
      if (snap.exists()) {
        const affiliates = snap.val();
       
        // Find affiliate with matching referral code
        for (const [affiliateId, affiliateData] of Object.entries(affiliates)) {
          const data = affiliateData as any;
          if (data.referralCode === refCode) {
            setReferrerName(data.name);
            setReferrerId(affiliateId);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching referrer:', error);
    }
  };

  /* ---------- Check if email exists ---------- */
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const affiliatesRef = ref(database, 'affiliates');
      const snap = await get(affiliatesRef);
     
      if (snap.exists()) {
        const affiliates = snap.val();
       
        // Check if any affiliate has this email
        for (const affiliateData of Object.values(affiliates)) {
          const data = affiliateData as any;
          if (data.email === email) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  /* ---------- Track referral ---------- */
  const trackReferral = async (referredUserId: string, referrerId: string, userDetails: any) => {
    try {
      console.log('Tracking referral:', { referredUserId, referrerId, userDetails });
     
      // Add referral to referrer's list
      const referralRef = ref(database, `referrals/${referrerId}/list`);
      const newRef = push(referralRef);
     
      const referralData = {
        referredUserId: referredUserId,
        referredUserName: userDetails.name,
        referredUserEmail: userDetails.email,
        referredUserPhone: userDetails.phone,
        referralCode: referrerId,
        joinedAt: new Date().toISOString(),
        status: 'pending',
        earnings: 0,
        product: 'Affiliate Membership',
        purchaseAmount: 1
      };
     
      await set(newRef, referralData);
      console.log('Referral data saved:', referralData);
      
      // Update referrer stats
      const statsRef = ref(database, `referrals/${referrerId}/stats`);
      const statsSnap = await get(statsRef);
     
      let currentStats = {
        totalReferrals: 0,
        referralEarnings: 0,
        pendingReferrals: 0,
        networkSize: 0,
        totalSales: 0,
        conversionRate: 0
      };
     
      if (statsSnap.exists()) {
        currentStats = statsSnap.val();
      }
     
      const updatedStats = {
        ...currentStats,
        totalReferrals: currentStats.totalReferrals + 1,
        pendingReferrals: currentStats.pendingReferrals + 1,
        networkSize: currentStats.networkSize + 1
      };
     
      await set(statsRef, updatedStats);
      console.log('Stats updated:', updatedStats);
      console.log('Referral tracked successfully for referrer:', referrerId);
     
    } catch (error) {
      console.error('Error tracking referral:', error);
    }
  };

  /* ---------- Generate referral code ---------- */
  const generateReferralCode = (name: string, uid: string) => {
    const namePart = name.replace(/\s+/g, '').toLowerCase().substring(0, 6);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${namePart}${randomPart}`;
  };

  /* ---------- Razorpay Payment Handler ---------- */
  const initiateRazorpayPayment = async () => {
    if (!razorpayLoaded) {
      toast({
        title: 'Payment Error',
        description: 'Payment system is loading. Please try again in a moment.',
        variant: 'destructive',
      });
      return false;
    }

    if (!window.Razorpay) {
      toast({
        title: 'Payment Error',
        description: 'Razorpay not available. Please refresh the page.',
        variant: 'destructive',
      });
      return false;
    }

    const options = {
      key: RAZORPAY_CONFIG.key_id,
      amount: 100, // ₹999 in paise
      currency: 'INR',
      name: 'SwissGain',
      description: 'Affiliate Membership Registration',
      image: '/logo.png',
      handler: async function (response: any) {
        console.log('Payment successful:', response);
        await completeRegistrationAfterPayment(response);
      },
      prefill: {
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.phone,
      },
      notes: {
        address: 'SwissGain Affiliate Program',
        user_id: userId,
      },
      theme: {
        color: '#b45309',
      },
      modal: {
        ondismiss: function() {
          toast({
            title: 'Payment Cancelled',
            description: 'You cancelled the payment process.',
            variant: 'default',
          });
        }
      }
    };

    try {
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      return true;
    } catch (error) {
      console.error('Razorpay initialization error:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  /* ---------- Complete registration after successful payment ---------- */
  const completeRegistrationAfterPayment = async (paymentResponse: any) => {
    setLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
     
      const userRef = ref(database, `affiliates/${userId}`);
      const referralCode = generateReferralCode(userDetails.name, userId);
     
      const userData = {
        uid: userId,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        isAffiliate: true,
        joinDate: new Date().toISOString(),
        referralCode: referralCode,
        referralLink: `${window.location.origin}/affiliate?ref=${referralCode}`,
        payment: {
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          amount: 1,
          currency: 'INR',
          status: 'completed',
          paid_at: new Date().toISOString(),
        },
        ...(refCode && referrerId && { referredBy: refCode, referredById: referrerId })
      };

      await set(userRef, userData);

      // ✅ Login the user through shared auth context
      login(userData);

      if (refCode && referrerId) {
        await trackReferral(userId, referrerId, userDetails);
        toast({
          title: 'Referral Tracked!',
          description: `You were referred by ${referrerName}. They will be notified.`,
        });
      }

      setShowPayment(false);
      setUserDetails({ name: '', email: '', phone: '' });
     
      toast({
        title: 'Payment Successful! 🎉',
        description: 'Welcome to SwissGain Affiliate Program! Redirecting to dashboard...',
      });

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error) {
      console.error('Registration error after payment:', error);
      toast({
        title: 'Registration Error',
        description: 'Payment was successful but registration failed. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Payment Handler ---------- */
  const handlePayment = async () => {
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      toast({
        title: 'Incomplete Details',
        description: 'Please fill all fields.',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userDetails.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
   
    if (userDetails.phone.length < 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    if (!userId) {
      toast({
        title: 'Error',
        description: 'User ID not found. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const emailExists = await checkEmailExists(userDetails.email);
     
      if (emailExists) {
        toast({
          title: 'Account Already Exists',
          description: 'An account with this email already exists. Please login instead.',
          variant: 'destructive',
        });
        setShowPayment(false);
        setLoading(false);
        return;
      }

      const paymentInitiated = await initiateRazorpayPayment();
      
      if (!paymentInitiated) {
        setLoading(false);
      }

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  /* ---------- Login ---------- */
  const handleLogin = async () => {
    if (!loginCreds.email || !loginCreds.phone) {
      toast({
        title: 'Error',
        description: 'Both email and phone are required.',
        variant: 'destructive',
      });
      return;
    }
   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginCreds.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
   
    if (loginCreds.phone.length < 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid phone number.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const user = await findUserByCredentials(loginCreds.email, loginCreds.phone);
     
      if (user) {
        // ✅ Login through shared auth context
        login(user);
        setShowLogin(false);
        setLoginCreds({ email: '', phone: '' });
       
        toast({
          title: 'Success!',
          description: 'Logged in successfully. Redirecting to dashboard...',
        });
       
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        toast({
          title: 'Invalid Credentials',
          description: 'No account found with these email and phone combination.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Input handlers ---------- */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginCreds((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------- Rank data (static) ---------- */
  const rankData = [
    { id: 1, name: "Starter", discount: 100, buyerPays: 2899, selfPV: "Membership Paid", directMembers: 0, teamPV: 0 },
    { id: 2, name: "Builder", discount: 200, buyerPays: 2799, selfPV: 500, directMembers: 5, teamPV: 1000 },
    { id: 3, name: "Leader", discount: 300, buyerPays: 2699, selfPV: 1000, directMembers: 10, teamPV: 3000 },
    { id: 4, name: "Supervisor", discount: 400, buyerPays: 2599, selfPV: 2000, directMembers: 15, teamPV: 7000 },
    { id: 5, name: "Mentor", discount: 500, buyerPays: 2499, selfPV: 4000, directMembers: 20, teamPV: 15000 },
    { id: 6, name: "Ambassador", discount: 600, buyerPays: 2399, selfPV: 8000, directMembers: 25, teamPV: 30000 },
    { id: 7, name: "Director", discount: 700, buyerPays: 2299, selfPV: 16000, directMembers: 35, teamPV: 60000 },
    { id: 8, name: "Chairman", discount: 800, buyerPays: 2199, selfPV: 32000, directMembers: 50, teamPV: 100000 },
    { id: 9, name: "Crown", discount: 900, buyerPays: 2099, selfPV: 64000, directMembers: 75, teamPV: 170000 },
    { id: 10, name: "Legend", discount: 1000, buyerPays: 1999, selfPV: 128000, directMembers: 100, teamPV: 300000 }
  ];

  return (
    <div className="py-12 bg-gradient-to-b from-muted/20 to-muted/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Referral Banner */}
        {referrerName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Handshake className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-blue-800">
                You were referred by <strong>{referrerName}</strong>
              </p>
            </div>
          </div>
        )}
        
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 py-1 px-3 text-primary font-semibold">
            Earn with SwissGain
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">SwissGain Affiliate Program</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join our jewelry affiliate program and earn up to ₹1,000 commission on every neckchain sold.
            Grow your team and increase your earnings through our 10-rank advancement system.
          </p>
        </div>

        {/* ---------- Payment Modal ---------- */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete Registration
                </CardTitle>
                <CardDescription>Join the affiliate program with secure payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="reg-name">Full Name *</Label>
                    <Input
                      id="reg-name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={userDetails.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email">Email Address *</Label>
                    <Input
                      id="reg-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={userDetails.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-phone">Phone Number *</Label>
                    <Input
                      id="reg-phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={userDetails.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Payment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Affiliate Membership:</span>
                      <span>₹1</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>One-time lifetime fee</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>₹999</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700">
                    <strong>Secure Payment:</strong> Powered by Razorpay. Your payment details are safe and encrypted.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => setShowPayment(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button onClick={handlePayment} disabled={loading || !razorpayLoaded}>
                    {loading ? 'Processing...' : !razorpayLoaded ? 'Loading Payment...' : 'Pay ₹1'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------- Login Modal ---------- */}
        {showLogin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Login to Your Account
                </CardTitle>
                <CardDescription>Enter your registered email and phone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="login-email">Email *</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginCreds.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-phone">Phone *</Label>
                    <Input
                      id="login-phone"
                      name="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={loginCreds.phone}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => setShowLogin(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button onClick={handleLogin} disabled={loading}>
                    {loading ? 'Checking...' : 'Login'}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Not registered?{' '}
                  <button
                    onClick={() => {
                      setShowLogin(false);
                      setShowPayment(true);
                    }}
                    className="text-primary underline hover:text-primary/80"
                  >
                    Register now
                  </button>
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------- Main Content ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* How it works */}
          <div className="lg:col-span-2">
            <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">How It Works</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Understand our affiliate program structure and earning potential
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-8">
                  {/* Price boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-[#300708] rounded-xl p-5 text-center border border-[#b45309]/50 shadow-sm">
                      <div className="text-3xl font-bold text-white mb-1">₹2,999</div>
                      <p className="text-sm font-medium text-white/90">Product Price</p>
                    </div>
                    <div className="bg-[#300708] rounded-xl p-5 text-center border border-[#d97706]/50 shadow-sm">
                      <div className="text-3xl font-bold text-white mb-1">₹1</div>
                      <p className="text-sm font-medium text-white/90">Membership Fee</p>
                    </div>
                    <div className="bg-[#300708] rounded-xl p-5 text-center border border-[#b45309]/50 shadow-sm">
                      <div className="text-3xl font-bold text-white mb-1">₹100–1,000</div>
                      <p className="text-sm font-medium text-white/90">Commission Range</p>
                    </div>
                  </div>
                  {/* Key concepts */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border"></div>
                      <h3 className="text-lg font-semibold text-foreground flex-shrink-0">Key Concepts</h3>
                      <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { icon: TrendingUp, title: 'PV (Point Value)', desc: '1 PV = ₹100 in sales value' },
                        { icon: Users, title: 'Direct Members', desc: 'People who joined through your referral' },
                        { icon: BarChart3, title: 'Team Sales', desc: 'Total PV from your entire network' },
                        { icon: Target, title: 'Self PV', desc: 'Your personal sales volume requirement' },
                      ].map((item, i) => (
                        <div key={i} className="bg-muted/40 p-4 rounded-lg border">
                          <div className="flex items-start mb-2">
                            <div className="bg-primary rounded-full p-1.5 mr-3 flex-shrink-0">
                              <item.icon className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <span className="font-semibold text-foreground">{item.title}</span>
                              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Example */}
                  <div className="bg-primary/5 p-5 rounded-xl border border-primary/20">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      Example Calculation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      As a Starter rank affiliate, you earn ₹100 per sale. With just 10 sales,
                      you recover your ₹1 membership fee and start making profit!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Membership Card */}
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
            <CardHeader className="text-center pb-4 pt-6">
              <div className="mx-auto mb-3 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground mb-2">Affiliate Membership</CardTitle>
              <div className="text-4xl font-bold text-primary mb-2">
                ₹1<span className="text-lg font-normal text-muted-foreground">/ lifetime</span>
              </div>
              <CardDescription>One-time membership fee with no recurring charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-muted/40 rounded-lg">
                  <span className="text-foreground font-medium">Commission per sale</span>
                  <span className="font-semibold text-primary">₹100-₹1,000</span>
                </div>
                {['Marketing materials', 'Real-time dashboard', 'Training & support'].map((txt, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-4">
                    <span className="text-foreground">{txt}</span>
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                ))}
              </div>
              {/* Buttons */}
              <div className="space-y-3">
                {!isLoggedIn ? (
                  <>
                    <Button
                      onClick={() => setShowPayment(true)}
                      className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
                      disabled={loading}
                    >
                      <Handshake className="mr-2 h-5 w-5" />
                      Join Affiliate Program
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowLogin(true)}
                      className="w-full"
                      disabled={loading}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Already Registered? Login
                    </Button>
                  </>
                ) : (
                  <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/20">
                    <p className="text-primary font-semibold mb-2">
                      {isAffiliate ? "You're already a member!" : "Welcome back!"}
                    </p>
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm" className="border-primary/30">
                        View Dashboard
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 text-center font-medium">
                  <span className="font-bold">Break even with just 10 sales.</span> Start earning profit immediately after.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Add Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}