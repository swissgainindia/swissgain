'use client';
import { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { addProductToCart } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import ProductCard from '@/components/product-card';
import { Star, Check, ShoppingCart, Zap, Truck, RotateCcw, Shield, Plus, Minus, Heart, Share2, ArrowLeft, CreditCard, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, push, set, get, update } from 'firebase/database';

// Firebase Configuration
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

// Initialize Firebase only once
let database: any = null;
const initializeFirebase = () => {
  if (database) return database;
  try {
    let app;
    const apps = getApps();
    if (apps.length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = apps[0];
    }
    database = getDatabase(app);
    return database;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

const firebaseDatabase = initializeFirebase();

// Razorpay Configuration
const RAZORPAY_CONFIG = {
  key_id: "rzp_live_RjxoVsUGVyJUhQ",
  key_secret: "shF22XqtflD64nRd2GdzCYoT",
};

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
   
    if (window.Razorpay) {
      resolve(true);
      return;
    }
   
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Commission rates (total ~24.4%)
const commissionRates = [0.10, 0.05, 0.025, 0.02, 0.015, 0.01, 0.008, 0.006, 0.005, 0.005];

interface OrderData {
  productId: string;
  affiliateId?: string;
  customerId?: string;
  originalCustomerId?: string;
  productName: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  totalAmount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  images: string[];
  category: string;
  discount?: number;
  productDescription?: string;
  productFeatures?: string[];
  productBrand?: string;
  productRating?: number;
  productReviews?: number;
  paymentId?: string;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

// Customer ID Helpers
const generateUniqueCustomerId = () => {
  if (typeof window === 'undefined') return "default_customer";
  let customerId = localStorage.getItem('uniqueCustomerId');
  if (!customerId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    customerId = `cust_${timestamp}_${randomStr}`;
    localStorage.setItem('uniqueCustomerId', customerId);
    sessionStorage.setItem('uniqueCustomerId', customerId);
  }
  return customerId;
};

const getOrCreateCustomerId = () => generateUniqueCustomerId();

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};

// Upline Chain
const getUplineChain = async (affiliateId: string, maxLevels = 10): Promise<any[]> => {
  const chain = [];
  let current = affiliateId;
  for (let i = 0; i < maxLevels; i++) {
    const userRef = ref(firebaseDatabase, `affiliates/${current}`);
    const snap = await get(userRef);
    if (!snap.exists()) break;
    const user = snap.val();
    if (!user.referredById) break;
    chain.unshift({
      id: user.referredById,
      level: i + 1,
      name: user.name || 'Unknown'
    });
    current = user.referredById;
  }
  return chain;
};

// Save Order
const saveOrderToFirebase = async (orderData: OrderData): Promise<string> => {
  try {
    const ordersRef = ref(firebaseDatabase, 'orders');
    const newOrderRef = push(ordersRef);
    const orderId = newOrderRef.key!;
   
    const orderWithId = {
      ...orderData,
      id: orderId,
      uniqueOrderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      commissionProcessed: false,
      creditedUplines: {}
    };
   
    await set(newOrderRef, orderWithId);
    return orderId;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

// Update Order Payment Status
const updateOrderPaymentStatus = async (orderId: string, paymentId: string, status: 'paid' | 'failed'): Promise<void> => {
  try {
    const orderRef = ref(firebaseDatabase, `orders/${orderId}`);
    const updates = {
      paymentId,
      paymentStatus: status,
      status: status === 'paid' ? 'pending' : 'cancelled',
      paymentUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
   
    await update(orderRef, updates);
  } catch (error) {
    console.error('Error updating payment status in Firebase:', error);
    console.error('Error details:', {
      orderId,
      paymentId,
      status,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
};

// Save Commission Record
const saveCommissionRecord = async (commissionData: any): Promise<void> => {
  try {
    const commissionsRef = ref(firebaseDatabase, `commissions/${commissionData.affiliateId}`);
    const newCommissionRef = push(commissionsRef);
    await set(newCommissionRef, {
      ...commissionData,
      id: newCommissionRef.key,
      uniqueCommissionId: `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'completed'
    });
  } catch (error) {
    console.error('Error saving commission:', error);
    throw error;
  }
};

// Add to Wallet
const addCommissionToWallet = async (affiliateId: string, amount: number, description: string, orderId: string): Promise<void> => {
  try {
    const walletRef = ref(firebaseDatabase, `wallets/${affiliateId}`);
    const transactionRef = push(ref(firebaseDatabase, `transactions/${affiliateId}`));
    const snap = await get(walletRef);
    const currentBalance = snap.exists() ? snap.val().balance : 0;
  
    const newBalance = currentBalance + amount;
    await set(walletRef, {
      balance: newBalance,
      upiId: snap.exists() ? snap.val().upiId : '',
      lastUpdated: new Date().toISOString()
    });
    await set(transactionRef, {
      amount,
      type: 'credit',
      description,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
      orderId,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error adding to wallet:', error);
    throw error;
  }
};

// Update Referral After Purchase
const updateReferralAfterPurchase = async (affiliateId: string, customerId: string, customerName: string, customerEmail: string, earnings: number, productName: string, orderId: string): Promise<void> => {
  try {
    const uniqueReferralId = `ref_${customerId}_${Date.now()}`;
    const referralRef = ref(firebaseDatabase, `referrals/${affiliateId}/${uniqueReferralId}`);
    await set(referralRef, {
      referredUserId: customerId,
      referredUserName: customerName,
      referredUserEmail: customerEmail,
      joinedAt: new Date().toISOString(),
      status: 'completed',
      earnings,
      purchaseAmount: earnings * 10,
      purchaseDate: new Date().toISOString(),
      walletCredited: true,
      productName,
      orderId,
      uniqueReferralId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating referral:', error);
    throw error;
  }
};

// Update Referral Stats
const updateReferralStats = async (affiliateId: string, amount: number): Promise<void> => {
  try {
    const statsRef = ref(firebaseDatabase, `referrals/${affiliateId}/stats`);
    const snap = await get(statsRef);
    const currentStats = snap.exists() ? snap.val() : { totalReferrals: 0, referralEarnings: 0, totalSales: 0 };
    await set(statsRef, {
      ...currentStats,
      referralEarnings: (currentStats.referralEarnings || 0) + amount,
      totalSales: (currentStats.totalSales || 0) + 1
    });
  } catch (error) {
    console.error('Error updating stats:', error);
  }
};

// Combined 10% + ₹100 Fixed Bonus for Direct Referral Link Purchase
const giveCombinedReferralBonus = async (directReferrerId: string, customerName: string, productName: string, orderId: string, totalAmount: number): Promise<void> => {
  try {
    // Calculate 10% commission
    const commissionAmount = Math.round(totalAmount * 0.10);
    const fixedBonusAmount = 100;
    const totalEarnings = commissionAmount + fixedBonusAmount;
    const transactionDescription = `Level 1 commission (10.0%) from ${customerName}'s purchase of ${productName} + ₹${fixedBonusAmount} fixed affiliate bonus`;
   
    const commissionDescription = `Combined earnings: 10% commission (₹${commissionAmount}) + ₹${fixedBonusAmount} bonus = ₹${totalEarnings} from ${customerName}'s purchase of ${productName}`;
    await saveCommissionRecord({
      affiliateId: directReferrerId,
      affiliateName: 'Direct Referrer',
      customerId: 'guest',
      customerName,
      customerEmail: '',
      customerPhone: '',
      orderId,
      productName,
      productDescription: productName,
      productCategory: 'Combined Commission + Bonus',
      productBrand: 'SwissGain',
      productImages: [],
      purchaseAmount: totalAmount,
      commissionAmount: totalEarnings,
      commissionRate: '10% + ₹100 Bonus',
      level: 1,
      description: commissionDescription,
      status: 'completed',
      type: 'combined_referral_bonus',
      timestamp: new Date().toISOString(),
      breakdown: {
        commission: commissionAmount,
        fixedBonus: fixedBonusAmount,
        total: totalEarnings
      }
    });
    await addCommissionToWallet(directReferrerId, totalEarnings, transactionDescription, orderId);
    await updateReferralStats(directReferrerId, totalEarnings);
  } catch (error) {
    console.error('Failed to give combined referral bonus:', error);
    throw error;
  }
};

// Process multi-level commissions
const processMultiLevelCommissions = async (buyerAffiliateId: string, orderId: string, totalAmount: number, formData: any, product: any) => {
  try {
    const chain = await getUplineChain(buyerAffiliateId);
    if (chain.length === 0) return;
    const creditedUplines = chain.reduce((acc, u) => ({ ...acc, [u.id]: true }), {});
    await update(ref(firebaseDatabase, `orders/${orderId}`), { creditedUplines });
    for (const upline of chain) {
      const level = upline.level;
      const rate = commissionRates[level - 1];
     
      let commissionAmount = Math.round(totalAmount * rate);
      let fixedBonusAmount = 0;
     
      if (level === 1) {
        fixedBonusAmount = 100;
        commissionAmount += fixedBonusAmount;
      }
     
      let description = '';
      if (level === 1) {
        description = `Level ${level} commission (${(rate * 100).toFixed(1)}%) from ${formData.name}'s purchase of ${product.name} + ₹${fixedBonusAmount} fixed affiliate bonus`;
      } else {
        description = `Level ${level} commission (${(rate * 100).toFixed(1)}%) from ${formData.name}'s purchase`;
      }
      await saveCommissionRecord({
        affiliateId: upline.id,
        affiliateName: upline.name,
        customerId: buyerAffiliateId,
        customerName: formData.name,
        customerEmail: formData.email,
        orderId,
        productName: product.name,
        purchaseAmount: totalAmount,
        commissionAmount,
        commissionRate: level === 1 ? '10% + ₹100 Bonus' : (rate * 100).toFixed(1) + '%',
        level,
        description,
        status: 'completed',
        timestamp: new Date().toISOString(),
        ...(level === 1 && {
          type: 'combined_referral_bonus',
          breakdown: {
            commission: Math.round(totalAmount * rate),
            fixedBonus: fixedBonusAmount,
            total: commissionAmount
          }
        })
      });
      await addCommissionToWallet(upline.id, commissionAmount, description, orderId);
      await updateReferralStats(upline.id, commissionAmount);
    }
    if (chain.length > 0) {
      const directComm = Math.round(totalAmount * 0.10) + 100;
      await updateReferralAfterPurchase(chain[0].id, buyerAffiliateId, formData.name, formData.email, directComm, product.name, orderId);
    }
  } catch (error) {
    console.error('Multi-level commission failed:', error);
    throw error;
  }
};

// NEW FUNCTION: Mark user as purchased
const markUserAsPurchased = async (userId: string) => {
  try {
    const affiliateRef = ref(firebaseDatabase, `affiliates/${userId}`);
    const snap = await get(affiliateRef);
    
    if (snap.exists()) {
      await update(affiliateRef, {
        hasPurchasedProduct: true,
        lastPurchaseDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      console.log(`User ${userId} marked as purchased product`);
    }
  } catch (error) {
    console.error('Error marking user as purchased:', error);
  }
};

// Checkout Modal with Razorpay Integration - RESPONSIVE FIXES
interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  quantity: number;
  affiliateId?: string;
  customerId: string;
  uid?: string;
}

function CheckoutModal({ isOpen, onClose, product, quantity, affiliateId, customerId, uid }: CheckoutModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: ""
  });
  const totalAmount = product.price * quantity;
  
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" });
     
      // Load Razorpay script when modal opens
      loadRazorpayScript().then((loaded) => {
        setRazorpayLoaded(!!loaded);
        if (!loaded) {
          toast({
            title: 'Payment System Error',
            description: 'Failed to load payment system. Please refresh the page.',
            variant: 'destructive',
          });
        }
      });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePurchaseCustomerId = () => uid || `purchase_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;

  // Process commissions after payment
  const processCommissionsAfterPayment = async (orderId: string, orderData: OrderData) => {
    try {
      // Combined 10% + ₹100 Bonus for Direct Referral Link
      if (affiliateId && uid !== affiliateId) {
        const referrerSnap = await get(ref(firebaseDatabase, `affiliates/${affiliateId}`));
       
        if (referrerSnap.exists()) {
          await giveCombinedReferralBonus(affiliateId, formData.name, product.name, orderId, totalAmount);
        }
      }
      // Multi-level commissions (only if buyer is affiliate)
      if (uid) {
        const affSnap = await get(ref(firebaseDatabase, `affiliates/${uid}`));
       
        if (affSnap.exists() && affSnap.val().isAffiliate) {
          await processMultiLevelCommissions(uid, orderId, totalAmount, formData, product);
        }
      }
    } catch (error) {
      console.error('Commission processing error details:', {
        error: error.message,
        stack: error.stack,
        orderId,
        affiliateId,
        uid
      });
      throw error;
    }
  };

  // Initiate Razorpay Payment with mobile fixes
  const initiateRazorpayPayment = async (orderData: OrderData) => {
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
    
    // Check mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const options = {
      key: RAZORPAY_CONFIG.key_id,
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      name: 'SwissGain',
      description: `Purchase: ${product.name}`,
      image: '/logo.png',
      handler: async function (response: any) {
        try {
          const paidOrderData: OrderData = {
            ...orderData,
            status: 'pending',
            paymentStatus: 'paid',
            paymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id || '',
            razorpaySignature: response.razorpay_signature || '',
            createdAt: new Date().toISOString(),
          };
          const orderId = await saveOrderToFirebase(paidOrderData);
          
          // MARK USER AS PURCHASED - ONLY THIS ADDITION
          if (uid) {
            await markUserAsPurchased(uid);
          }
          
          await processCommissionsAfterPayment(orderId, paidOrderData);
          toast({
            title: "Payment Successful 🎉",
            description: `Order ID: ${orderId}`,
          });
          onClose();
          window.location.href = `/thank-you`;
        } catch (err) {
          toast({
            title: "Payment done but order failed",
            description: "Contact support with payment ID",
            variant: "destructive",
          });
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      notes: {
        address: formData.address,
        product_id: product._id,
        customer_id: customerId,
        affiliate_id: affiliateId || 'none'
      },
      theme: {
        color: '#b45309',
      },
      // MOBILE FIXES
      modal: {
        ondismiss: function() {
          toast({
            title: 'Payment Cancelled',
            description: 'You cancelled the payment process.',
            variant: 'default',
          });
        },
        // Prevent modal scaling issues on mobile
        escape: true,
        animation: true
      },
      // Additional mobile optimizations
      retry: {
        enabled: true,
        max_count: 2
      },
      timeout: 300,
      remember_customer: true,
      // Fix for mobile viewport
      config: {
        display: {
          blocks: {
            banks: {
              name: "Bank Offer",
              instruments: [
                {
                  method: "card",
                  issuers: ["HDFC", "ICICI", "AXIS", "SBI", "KOTAK"]
                },
                {
                  method: "netbanking",
                  banks: ["HDFC", "ICICI", "AXIS", "SBI", "KOTAK"]
                }
              ]
            },
            upi: {
              name: "Pay using UPI",
              instruments: [
                {
                  method: "upi"
                }
              ]
            }
          },
          sequence: ["block.banks", "block.upi"],
          preferences: {
            show_default_blocks: true
          }
        }
      }
    };
    try {
      const razorpayInstance = new window.Razorpay(options);
      
      // Fix for mobile browsers
      if (isMobile) {
        // Ensure proper viewport on mobile
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        
        razorpayInstance.on('close', function() {
          document.documentElement.style.overflow = 'auto';
          document.body.style.overflow = 'auto';
        });
      }
      
      razorpayInstance.open();
      return true;
    } catch (error) {
      console.error('Razorpay initialization error:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
      
      // Restore scroll on error
      if (isMobile) {
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast({ title: "Incomplete Form", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const purchaseCustomerId = generatePurchaseCustomerId();
      const orderData: OrderData = {
        productId: product._id,
        ...(affiliateId && { affiliateId }),
        customerId: purchaseCustomerId,
        originalCustomerId: customerId,
        productName: product.name,
        price: product.price,
        quantity,
        totalAmount,
        customerInfo: formData,
        images: product.images,
        category: product.category,
        paymentMethod: 'razorpay',
        paymentStatus: 'pending', // will change after payment
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      // 🔥 Directly open Razorpay
      await initiateRazorpayPayment(orderData);
    } catch (err: any) {
      toast({
        title: "Checkout Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CreditCard className="h-5 w-5" />
            Secure Checkout
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-muted p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Order Summary</h3>
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded" 
                loading="lazy" 
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">{product.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Quantity: {quantity}</p>
                <p className="font-semibold text-sm sm:text-base">₹{product.price.toLocaleString()} each</p>
              </div>
            </div>
            <div className="border-t pt-2 sm:pt-3">
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span>Subtotal:</span>
                <span>₹{(product.price * quantity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span>Shipping:</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between font-semibold text-base sm:text-lg mt-2 pt-2 border-t">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          {affiliateId && (
            <div className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
              <p className="text-xs sm:text-sm font-medium text-green-800">Referral Purchase Detected</p>
              <p className="text-xs text-green-700 mt-1">
                Your referrer will earn 10% commission + ₹100 bonus = ₹{Math.round(totalAmount * 0.10) + 100} on this purchase!
              </p>
            </div>
          )}
          {uid && (
            <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm font-medium text-blue-800">Affiliate Purchase</p>
              <p className="text-xs text-blue-700 mt-1">Your upline will earn commissions on this purchase.</p>
            </div>
          )}
          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm font-medium text-blue-800">Your Customer ID</p>
            <div className="mt-2 flex items-center justify-between bg-white p-2 rounded border">
              <code className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded truncate flex-1 mr-2">
                {customerId}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0"
                onClick={() => navigator.clipboard.writeText(customerId)}
              >
                Copy
              </Button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Full Name *</Label>
              <Input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
                placeholder="Enter your full name" 
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Email *</Label>
              <Input 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                required 
                placeholder="your@email.com" 
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Phone *</Label>
              <Input 
                name="phone" 
                type="tel" 
                value={formData.phone} 
                onChange={handleInputChange} 
                required 
                placeholder="9876543210" 
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Address *</Label>
              <Input 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange} 
                required 
                placeholder="Street address, building, etc." 
                className="text-sm sm:text-base"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">City *</Label>
                <Input 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Your city" 
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">State *</Label>
                <Input 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Your state" 
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">PIN Code *</Label>
              <Input 
                name="pincode" 
                value={formData.pincode} 
                onChange={handleInputChange} 
                required 
                placeholder="6-digit PIN" 
                className="text-sm sm:text-base"
              />
            </div>
           
            <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium">Secure Payment by Razorpay</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between text-xs gap-1">
                <span className="text-muted-foreground">Payment Methods:</span>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="bg-white px-2 py-1 rounded border text-xs">Credit Card</span>
                  <span className="bg-white px-2 py-1 rounded border text-xs">Debit Card</span>
                  <span className="bg-white px-2 py-1 rounded border text-xs">UPI</span>
                  <span className="bg-white px-2 py-1 rounded border text-xs">Net Banking</span>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground py-3 text-sm sm:text-base"
              disabled={loading || paymentLoading || !razorpayLoaded}
            >
              {paymentLoading ? 'Processing Payment...' :
               loading ? 'Creating Order...' :
               !razorpayLoaded ? 'Loading Payment...' :
               `Pay Securely ₹${totalAmount.toLocaleString()}`}
            </Button>
          </form>
          <div className="text-center text-xs text-gray-500 px-2">
            By completing your purchase, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Image Zoom Modal - RESPONSIVE FIXES
interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
}

function ImageZoomModal({ isOpen, onClose, images, currentIndex: initialIndex }: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const currentImage = images[currentIndex] || FALLBACK_IMAGE;

  const prev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrentIndex((i) => (i + 1) % images.length);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-1 sm:p-2 md:p-4 w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw]">
        <div className="relative flex items-center justify-center h-[60vh] sm:h-[70vh] md:h-[75vh]">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background z-10"
            onClick={prev}
          >
            <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
          <img
            src={currentImage}
            alt={`Zoomed image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background z-10"
            onClick={next}
          >
            <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-background/80 hover:bg-background z-10"
            onClick={onClose}
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          {images.length > 1 && (
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-primary' : 'bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400?text=No+Image+Available';

export default function ProductDetail() {
  const [, params] = useRoute('/product/:id');
  const productId = params?.id;
  const getAffiliateIdFromUrl = () => {
    if (typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    return params.get('ref') || params.get('affiliate') || undefined;
  };
  const affiliateId = getAffiliateIdFromUrl();
  const uid = getCookie('swissgain_uid') || undefined;
  const customerId = uid || getOrCreateCustomerId();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { updateData } = useLocalStorage();
  const { toast } = useToast();
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        const res = await axios.get(`/api/products/${productId}`);
        if (res.data) {
          const mainImage = res.data.image || null;
          const additionalImages = res.data.images ? 
            (Array.isArray(res.data.images) ? res.data.images : res.data.images.split(',').map((s: string) => s.trim()).filter(Boolean)) : 
            [];
          const allImages = [mainImage, ...additionalImages].filter(Boolean);

          setProduct({
            ...res.data,
            images: allImages.length > 0 ? allImages : [FALLBACK_IMAGE],
            affiliateId
          });

          const relatedRes = await axios.get(`/api/products?category=${res.data.category}`);
          setRelatedProducts(relatedRes.data.filter((p: any) => p._id !== res.data._id).slice(0, 4).map((p: any) => {
            const pMainImage = p.image || null;
            const pAdditionalImages = p.images ? 
              (Array.isArray(p.images) ? p.images : p.images.split(',').map((s: string) => s.trim()).filter(Boolean)) : 
              [];
            const pAllImages = [pMainImage, ...pAdditionalImages].filter(Boolean);
            return { ...p, images: pAllImages.length > 0 ? pAllImages : [FALLBACK_IMAGE] };
          }));
        } else setError(true);
      } catch (err) {
        console.error('Failed to fetch product:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, affiliateId]);

  const isInStock = product?.inStock && (product?.stockQuantity || 0) > 0;

  const handleAddToCart = () => {
    if (!product || !isInStock) return;
    updateData(addProductToCart.bind(null, product, quantity));
    toast({
      title: 'Added to Cart',
      description: `${quantity} ${product.name}(s) added.`
    });
  };

  const handleBuyNow = () => {
    if (!isInStock) {
      toast({
        title: 'Out of Stock',
        description: 'This product is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }
    handleAddToCart();
    setIsCheckoutOpen(true);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsZoomOpen(true);
  };

  if (loading) return (
    <div className="py-20 bg-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Loading product...</p>
      </div>
    </div>
  );
  
  if (error || !product) return (
    <div className="py-20 bg-white min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Link href="/products">
          <Button className="gradient-primary text-primary-foreground px-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="py-8 sm:py-12 md:py-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center flex-wrap space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 px-2 sm:px-0">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          <span>/</span>
          <span className="capitalize text-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
            {product.category}
          </span>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
            {product.name}
          </span>
        </nav>
        
        {/* Product Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-start mb-12 sm:mb-16 px-2 sm:px-0">
          {/* Product Images */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg">
              <img
                src={product.images[selectedImageIndex] || FALLBACK_IMAGE}
                alt={product.name}
                className="w-full h-64 sm:h-72 md:h-80 lg:h-96 object-cover cursor-zoom-in transition-transform duration-300 hover:scale-110"
                onClick={() => handleImageClick(selectedImageIndex)}
                loading="eager"
                onError={(e) => {
                  console.warn(`Failed to load image: ${e.currentTarget.src}`);
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              {product.discount && (
                <Badge variant="destructive" className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 text-xs sm:text-sm md:text-lg px-2 sm:px-3 py-0.5 sm:py-1 z-10">
                  {product.discount}% OFF
                </Badge>
              )}
              {!isInStock && (
                <Badge variant="secondary" className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 text-xs sm:text-sm md:text-lg px-2 sm:px-3 py-0.5 sm:py-1 z-10">
                  Out of Stock
                </Badge>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">
                {product.images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img || FALLBACK_IMAGE}
                    alt={`Thumbnail ${i + 1}`}
                    className={`rounded-lg cursor-pointer h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 flex-shrink-0 object-cover transition-transform duration-200 hover:scale-105 ${
                      selectedImageIndex === i ? 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2' : ''
                    }`}
                    onClick={() => setSelectedImageIndex(i)}
                    loading="lazy"
                    onError={(e) => {
                      console.warn(`Failed to load thumbnail: ${e.currentTarget.src}`);
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 px-2 sm:px-0">
            <div>
              <Badge variant="outline" className="mb-3 sm:mb-4 capitalize text-xs sm:text-sm">
                {product.category}
              </Badge>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">{product.name}</h1>
              <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg sm:text-xl text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                    <Badge variant="destructive" className="text-xs sm:text-sm">
                      Save ₹{(product.originalPrice - product.price).toLocaleString()}
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center space-x-2 mb-4 sm:mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        i < Math.floor(product.rating || 0) ? 'fill-current text-accent' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  ({(product.rating || 0).toFixed(1)} from {product.reviews || 0} reviews)
                </span>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                {product.description}
              </p>
            </div>
            
            {/* Quantity and Actions */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <label className="text-sm sm:text-base font-medium">Quantity:</label>
                <div className="flex items-center border rounded-lg w-fit">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)}
                    disabled={!isInStock}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 sm:w-16 text-center border-0 text-sm sm:text-base"
                    disabled={!isInStock}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(q => q + 1)}
                    disabled={!isInStock}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 gradient-primary text-primary-foreground py-2.5 sm:py-3 text-sm sm:text-base"
                  size="lg"
                  disabled={!isInStock}
                >
                  <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 gradient-gold text-accent-foreground py-2.5 sm:py-3 text-sm sm:text-base"
                  size="lg"
                  disabled={!isInStock}
                >
                  <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Buy Now
                </Button>
              </div>
              {!isInStock && (
                <Badge variant="secondary" className="w-full py-2.5 sm:py-3 justify-center text-sm sm:text-base">
                  Out of Stock - Notify Me When Available
                </Badge>
              )}
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">Easy Returns</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm text-muted-foreground">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Tabs */}
        <Tabs defaultValue="features" className="mb-12 sm:mb-16 px-2 sm:px-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features" className="text-xs sm:text-sm">Features</TabsTrigger>
            <TabsTrigger value="specifications" className="text-xs sm:text-sm">Specifications</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs sm:text-sm">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="features" className="mt-4 sm:mt-8">
            <div className="bg-muted rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Product Features</h3>
              <ul className="space-y-2 sm:space-y-3">
                {product.features?.length > 0 ? product.features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start space-x-2 sm:space-x-3">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{f}</span>
                  </li>
                )) : <li className="text-muted-foreground text-sm sm:text-base">No features available</li>}
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="specifications" className="mt-4 sm:mt-8">
            <div className="bg-muted rounded-lg p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
                <div className="space-y-2">
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>Material:</strong> Swiss Premium Alloy</p>
                  <p><strong>Finish:</strong> 24K Gold Plated</p>
                </div>
                <div className="space-y-2">
                  <p><strong>Weight:</strong> Lightweight</p>
                  <p><strong>Care:</strong> Clean with soft cloth</p>
                  <p><strong>Warranty:</strong> Lifetime</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-4 sm:mt-8">
            <div className="bg-muted rounded-lg p-4 sm:p-6 text-center py-6 sm:py-8">
              <div className="text-3xl sm:text-4xl mb-2">{(product.rating || 0).toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      i < Math.floor(product.rating || 0) ? 'fill-current text-accent' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">
                Based on {product.reviews || 0} reviews
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12 sm:mb-16 px-2 sm:px-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
        
        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-primary to-yellow-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white text-center mt-12 sm:mt-16 mx-2 sm:mx-0">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Interested in Earning?</h3>
          <p className="mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base">
            Join our affiliate program and earn commissions on every sale!
          </p>
          <Link href="/affiliate">
            <Button variant="outline" className="border-white hover:bg-white text-primary text-sm sm:text-base">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={product}
        quantity={quantity}
        affiliateId={affiliateId}
        customerId={customerId}
        uid={uid}
      />
      <ImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        images={product.images}
        currentIndex={selectedImageIndex}
      />
    </div>
  );
}

// Add Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}