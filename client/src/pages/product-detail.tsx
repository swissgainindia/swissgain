'use client';
import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
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
import SEO from '@/components/layout/seo';
import { 
  Star, Check, ShoppingCart, Zap, Truck, Shield, 
  Plus, Minus, ArrowLeft, CreditCard, X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import axios from 'axios';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getDatabase, ref, push, set, get, update, 
  query, orderByChild, equalTo, onValue 
} from 'firebase/database';

import { useAuth } from '@/lib/auth';

// --- FIREBASE CONFIGURATION ---
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

// --- RAZORPAY CONFIGURATION ---
const RAZORPAY_CONFIG = {
  key_id: "rzp_live_RjxoVsUGVyJUhQ",
  key_secret: "shF22XqtflD64nRd2GdzCYoT",
};

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

// --- INTERFACES ---
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

// --- HELPER FUNCTIONS ---
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

// Mark user as purchased
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
    }
  } catch (error) {
    console.error('Error marking user as purchased:', error);
  }
};

// Fetch logged-in user data
const getLoggedInUserData = async (uid: string) => {
  if (!uid) return null;
  try {
    const userRef = ref(firebaseDatabase, `affiliates/${uid}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      const data = snap.val();
      return {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
      };
    }
  } catch (error) {
    console.error('Error fetching logged-in user data:', error);
  }
  return null;
};

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400?text=No+Image+Available';

// --- COMPONENTS ---

// 1. Review Modal
interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isSubmitting: boolean;
}

function ReviewModal({ isOpen, onClose, onSubmit, isSubmitting }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(rating, comment);
    setComment("");
    setRating(5);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-4">
            <Label>Your Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer transition-colors ${
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Your Experience</Label>
            <textarea
              id="comment"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What did you like or dislike?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full gradient-primary" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 2. Checkout Modal
interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  quantity: number;
  affiliateId?: string;
  customerId: string;
  uid?: string;
  isLoggedIn: boolean; 
}

function CheckoutModal({
  isOpen,
  onClose,
  product,
  quantity,
  affiliateId,
  customerId,
  uid,
  isLoggedIn, 
}: CheckoutModalProps) {

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: ""
  });

  const totalAmount = product.price * quantity;

  // Pre-fill form
  useEffect(() => {
   if (isOpen && uid && document.cookie.includes('swissgain_logged_in=true')) {
      const fetchUserData = async () => {
        const userData = await getLoggedInUserData(uid);
        if (userData) {
          setFormData({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address,
            city: userData.city,
            state: userData.state,
            pincode: userData.pincode,
          });
          toast({
            title: "Details Auto-filled",
            description: "Your saved information has been loaded from your account.",
          });
        }
      };
      fetchUserData();
    } else if (isOpen) {
      setFormData({ name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" });
    }

    // Load Razorpay
    loadRazorpayScript().then((loaded) => {
      setRazorpayLoaded(!!loaded);
      if (!loaded && isOpen) {
        toast({
          title: 'Payment System Error',
          description: 'Failed to load payment system. Please refresh the page.',
          variant: 'destructive',
        });
      }
    });
  }, [isOpen, uid, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 const generatePurchaseCustomerId = () =>
  isLoggedIn && uid
    ? uid
    : `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Process commissions
  const processCommissionsAfterPayment = async (orderId: string, orderData: OrderData) => {
    try {
      if (isLoggedIn && affiliateId && uid !== affiliateId) {
        const referrerSnap = await get(ref(firebaseDatabase, `affiliates/${affiliateId}`));
        if (referrerSnap.exists()) {
          await giveCombinedReferralBonus(affiliateId, formData.name, product.name, orderId, totalAmount);
        }
      }
      if (uid) {
        const affSnap = await get(ref(firebaseDatabase, `affiliates/${uid}`));
        if (affSnap.exists() && affSnap.val().isAffiliate) {
          await processMultiLevelCommissions(uid, orderId, totalAmount, formData, product);
        }
      }
    } catch (error) {
      console.error('Commission processing error:', error);
      throw error;
    }
  };

  // Initiate Razorpay
  const initiateRazorpayPayment = async (orderData: OrderData) => {
    if (!razorpayLoaded || !window.Razorpay) {
      toast({ title: 'Payment Error', description: 'System loading. Try again.', variant: 'destructive' });
      return false;
    }
    
    const options = {
      key: RAZORPAY_CONFIG.key_id,
      amount: Math.round(totalAmount * 100), // Ensure integer
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
          
          if (uid) {
            await markUserAsPurchased(uid);
          }
          
          await processCommissionsAfterPayment(orderId, paidOrderData);
          toast({ title: "Payment Successful 🎉", description: `Order ID: ${orderId}` });
          onClose();
          window.location.href = `/thank-you`;
        } catch (err) {
          toast({ title: "Payment done but order failed", description: "Contact support", variant: "destructive" });
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
      theme: { color: '#b45309' },
      modal: {
        ondismiss: function() {
          toast({ title: 'Payment Cancelled', description: 'Process cancelled.', variant: 'default' });
        }
      }
    };
    
    try {
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      return true;
    } catch (error) {
      console.error('Razorpay initialization error:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast({ title: "Incomplete Form", description: "Please fill all required fields.", variant: "destructive" });
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
        paymentStatus: 'pending',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      if (uid) {
        try {
          await update(ref(firebaseDatabase, `affiliates/${uid}`), {
            name: formData.name, email: formData.email, phone: formData.phone,
            address: formData.address, city: formData.city, state: formData.state,
            pincode: formData.pincode, lastUpdated: new Date().toISOString(),
          });
        } catch (err) { console.error("Profile update error:", err); }
      }

      await initiateRazorpayPayment(orderData);
    } catch (err: any) {
      toast({ title: "Checkout Failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Secure Checkout
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="flex items-center space-x-3 mb-3">
              <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded" loading="lazy" />
              <div className="flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                <p className="font-semibold">₹{product.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total:</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2"><Label>Full Name *</Label><Input name="name" value={formData.name} onChange={handleInputChange} required /></div>
             <div className="space-y-2"><Label>Email *</Label><Input name="email" type="email" value={formData.email} onChange={handleInputChange} required /></div>
             <div className="space-y-2"><Label>Phone *</Label><Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required /></div>
             <div className="space-y-2"><Label>Address *</Label><Input name="address" value={formData.address} onChange={handleInputChange} required /></div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>City *</Label><Input name="city" value={formData.city} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label>State *</Label><Input name="state" value={formData.state} onChange={handleInputChange} required /></div>
             </div>
             <div className="space-y-2"><Label>PIN Code *</Label><Input name="pincode" value={formData.pincode} onChange={handleInputChange} required /></div>
             <Button type="submit" className="w-full gradient-primary py-3" disabled={loading || !razorpayLoaded}>
               {loading ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString()}`}
             </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 3. Image Zoom Modal
interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
}

function ImageZoomModal({ isOpen, onClose, images, currentIndex: initialIndex }: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => { setCurrentIndex(initialIndex); }, [initialIndex, isOpen]);

  const currentImage = images[currentIndex] || FALLBACK_IMAGE;
  const prev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrentIndex((i) => (i + 1) % images.length);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-4">
        <div className="relative flex items-center justify-center h-[70vh]">
          <Button variant="ghost" size="sm" className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80" onClick={prev}><ChevronLeft className="h-8 w-8" /></Button>
          <img src={currentImage} className="max-w-full max-h-full object-contain rounded-lg" loading="lazy" onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} />
          <Button variant="ghost" size="sm" className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80" onClick={next}><ChevronRight className="h-8 w-8" /></Button>
          <Button variant="ghost" size="sm" className="absolute top-4 right-4 bg-background/80" onClick={onClose}><X className="h-6 w-6" /></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN PRODUCT DETAIL COMPONENT ---
export default function ProductDetail() {
  const { isLoggedIn } = useAuth(); 
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
  
  // Product State
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // UI State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  
  // Hooks
  const { updateData } = useLocalStorage();
  const { toast } = useToast();

  // Review State
  const [reviews, setReviews] = useState<any[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Stats State
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviewCount, setTotalReviewCount] = useState<number>(0);

  // 1. Fetch Product & Related Data
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

  // 2. Fetch Reviews & Calculate Weighted Average
  useEffect(() => {
    if (!productId || !product) return;

    // A. Real-time Reviews Listener
    const reviewsRef = ref(firebaseDatabase, `reviews/${productId}`);
    const unsubscribeReviews = onValue(reviewsRef, (snapshot) => {
      let realReviewsList: any[] = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        realReviewsList = Object.values(data).sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      // --- AGGREGATION LOGIC ---
      // 1. Real Data (Firebase)
      const realSum = realReviewsList.reduce((acc, r) => acc + Number(r.rating), 0);
      const realCount = realReviewsList.length;

      // 2. Manual Data (MongoDB)
      const manualRating = product.rating ? Number(product.rating) : 0; 
      // Ensure we look for ratingCount since we renamed it in backend
      const manualCount = product.ratingCount ? Number(product.ratingCount) : 0;
      const manualSum = manualRating * manualCount;

      // 3. Combine
      const combinedCount = realCount + manualCount;
      const combinedSum = realSum + manualSum;
      const finalAvg = combinedCount > 0 ? combinedSum / combinedCount : 0;

      // 4. Update State
      setAverageRating(finalAvg);
      setTotalReviewCount(combinedCount);
      
      // Limit review list to top 5 recent real reviews for display
      setReviews(realReviewsList.slice(0, 5));

      // Check User Status
      if (uid) {
        const hasReviewed = realReviewsList.some((r: any) => r.userId === uid);
        setUserHasReviewed(hasReviewed);
      }
    });

    // B. Check Purchase Eligibility
    const checkEligibility = async () => {
      if (!isLoggedIn || !uid) {
        setCanReview(false);
        return;
      }

      const ordersRef = ref(firebaseDatabase, 'orders');
      const q = query(ordersRef, orderByChild('customerId'), equalTo(uid));
      
      try {
        const snapshot = await get(q);
        if (snapshot.exists()) {
          const orders = snapshot.val();
          const hasPurchased = Object.values(orders).some((order: any) => 
            order.productId === productId && 
            (order.paymentStatus === 'paid' || order.status === 'delivered')
          );
          setCanReview(hasPurchased);
        } else {
          setCanReview(false);
        }
      } catch (err) {
        console.error("Error checking purchase history:", err);
        setCanReview(false);
      }
    };

    checkEligibility();

    return () => unsubscribeReviews();
  }, [productId, isLoggedIn, uid, product]);

  // 3. Handle Review Submission
  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!uid || !productId || !product) return;
    setIsSubmittingReview(true);

    try {
      const userRef = ref(firebaseDatabase, `affiliates/${uid}`);
      const userSnap = await get(userRef);
      const userData = userSnap.exists() ? userSnap.val() : { name: "Valued Customer" };

      const reviewData = {
        userId: uid,
        userName: userData.name || "Verified Buyer",
        rating,
        comment,
        createdAt: new Date().toISOString(),
        productId,
        productName: product.name 
      };

      const newReviewRef = push(ref(firebaseDatabase, `reviews/${productId}`));
      await set(newReviewRef, reviewData);

      // Update order to reflect review
      const ordersQ = query(ref(firebaseDatabase, 'orders'), orderByChild('customerId'), equalTo(uid));
      const orderSnap = await get(ordersQ);
      if (orderSnap.exists()) {
         const orders = orderSnap.val();
         const orderKey = Object.keys(orders).find(k => orders[k].productId === productId);
         if (orderKey) {
             await update(ref(firebaseDatabase, `orders/${orderKey}`), { hasReviewed: true });
         }
      }

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      setIsReviewOpen(false);
    } catch (error) {
      console.error("Review failed:", error);
      toast({
        title: "Error",
        description: "Could not submit review. Try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
    if (!isLoggedIn) {
      toast({
        title: 'Login Required',
        description: 'Please login to continue checkout',
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

  if (loading) return <div className="py-20 text-center text-xl">Loading product...</div>;
  if (error || !product) return (
    <div className="py-20 bg-white min-h-screen flex items-center justify-center text-center">
      <div>
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <Link href="/products">
          <Button className="gradient-primary text-primary-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="py-20 bg-white">
      {product && (
        <SEO 
          title={`${product.name} - Premium 1 Gram Gold Plated Jewelry | SwissGain India`}
          description={product.description}
          image={product.images && product.images[0] ? product.images[0] : product.image}
          url={`/product/${product._id}`}
          type="product"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href="/">Home</Link> <span>/</span>
          <Link href="/products">Products</Link> <span>/</span>
          <span className="capitalize">{product.category}</span> <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          
          {/* Left Column: Images */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <img
                src={product.images[selectedImageIndex] || FALLBACK_IMAGE}
                alt={product.name}
                className="w-full h-96 object-cover cursor-zoom-in transition-transform duration-300 hover:scale-110"
                onClick={() => handleImageClick(selectedImageIndex)}
                loading="eager"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
              {product.discount && (
                <Badge variant="destructive" className="absolute top-4 left-4 text-lg px-3 py-1 z-10">
                  {product.discount}% OFF
                </Badge>
              )}
              {!isInStock && (
                <Badge variant="secondary" className="absolute top-4 right-4 text-lg px-3 py-1 z-10">
                  Out of Stock
                </Badge>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img || FALLBACK_IMAGE}
                    alt={`Thumbnail ${i + 1}`}
                    className={`rounded-lg cursor-pointer h-20 w-20 flex-shrink-0 object-cover transition-transform duration-200 hover:scale-105 ${selectedImageIndex === i ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    onClick={() => setSelectedImageIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions */}
          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4 capitalize">{product.category}</Badge>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              
              {/* Price */}
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-4xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                    <Badge variant="destructive">Save ₹{(product.originalPrice - product.price).toLocaleString()}</Badge>
                  </>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">
                  ({totalReviewCount > 0 ? averageRating.toFixed(1) : "New"} from {totalReviewCount} reviews)
                </span>
              </div>
              
              <p className="text-muted-foreground text-lg mb-6">{product.description}</p>
            </div>

            {/* Quantity & Buttons */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)}
                    disabled={!isInStock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-0"
                    disabled={!isInStock}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(q => q + 1)}
                    disabled={!isInStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 gradient-primary text-primary-foreground py-3"
                  size="lg"
                  disabled={!isInStock}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 gradient-gold text-accent-foreground py-3"
                  size="lg"
                  disabled={!isInStock}
                >
                  <Zap className="mr-2 h-5 w-5" /> Buy Now
                </Button>
              </div>
              
              {!isInStock && (
                <Badge variant="secondary" className="w-full py-3 justify-center">
                  Out of Stock - Notify Me When Available
                </Badge>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Secure Payment</p>
              </div>
              <div className="text-center">
                <Check className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Quality Assured</p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS SECTION (Features, Specs, Reviews) */}
        <Tabs defaultValue="features" className="mb-16">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({totalReviewCount})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="features" className="mt-8">
            <div className="bg-muted rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Product Features</h3>
              <ul className="space-y-3">
                {product.features?.length > 0 ? product.features.map((f: string, i: number) => (
                  <li key={i} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{f}</span>
                  </li>
                )) : <li className="text-muted-foreground">No features available</li>}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="mt-8">
            <div className="bg-muted rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>Material:</strong> Swiss Premium Alloy</p>
                  <p><strong>Finish:</strong> 24K Gold Plated</p>
                </div>
                <div>
                  <p><strong>Weight:</strong> Lightweight</p>
                  <p><strong>Care:</strong> Clean with soft cloth</p>
                  <p><strong>Warranty:</strong> Lifetime</p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* REVIEWS TAB */}
          <TabsContent value="reviews" className="mt-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-muted rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    {totalReviewCount > 0 ? averageRating.toFixed(1) : "New"}
                  </div>
                  <div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                         <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{totalReviewCount} Total Reviews</p>
                  </div>
                </div>
                
                {/* Write Review Button Logic */}
                {canReview && !userHasReviewed && (
                  <Button onClick={() => setIsReviewOpen(true)} className="gradient-primary">
                    Write a Review
                  </Button>
                )}
                {userHasReviewed && (
                  <div className="text-green-600 font-medium flex items-center gap-2">
                    <Check className="h-4 w-4" /> Review Submitted
                  </div>
                )}
                {!canReview && !userHasReviewed && (
                  <div className="text-sm text-muted-foreground italic">
                    {isLoggedIn ? "Purchase this product to leave a review." : "Login and purchase to review."}
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="grid gap-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {totalReviewCount > 0 
                      ? "Showing aggregate rating from external platforms and direct sales." 
                      : "No reviews yet. Be the first to review!"}
                  </div>
                ) : (
                  reviews.map((review, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {review.userName.charAt(0)}
                          </div>
                          <span className="font-semibold">{review.userName}</span>
                          <Badge variant="secondary" className="text-xs ml-2 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Verified Buyer
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex text-yellow-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
        
        {/* Affiliate Banner */}
        <div className="bg-gradient-to-r from-primary to-yellow-700 rounded-2xl p-8 text-white text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Interested in Earning?</h3>
          <p className="mb-6 max-w-2xl mx-auto">Join our affiliate program and earn commissions on every sale!</p>
          <Link href="/affiliate">
            <Button variant="outline" className="border-white hover:bg-white text-primary">
              Learn More
            </Button>
          </Link>
        </div>

        {/* MODALS */}
        <ReviewModal 
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onSubmit={handleSubmitReview}
          isSubmitting={isSubmittingReview}
        />
        
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={product}
          quantity={quantity}
          affiliateId={affiliateId}
          customerId={customerId}
          uid={isLoggedIn ? uid : undefined}
          isLoggedIn={isLoggedIn}
        />

        <ImageZoomModal
          isOpen={isZoomOpen}
          onClose={() => setIsZoomOpen(false)}
          images={product.images}
          currentIndex={selectedImageIndex}
        />
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