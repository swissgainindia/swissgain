'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { removeFromCart, updateCartQuantity, clearCart } from '@/lib/storage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, CreditCard, Shield } from 'lucide-react';
import { Link } from 'wouter';
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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images?: string[];
  image?: string;
  category: string;
  originalPrice?: number;
  productId?: string;
  // Add other fields as needed from product
}

interface OrderData {
  items: CartItem[];
  affiliateId?: string;
  customerId?: string;
  originalCustomerId?: string;
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
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  commissionProcessed: boolean;
  creditedUplines?: Record<string, boolean>;
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
   
    // Ensure no undefined properties are set
    const cleanOrderData = { ...orderData };
    if (cleanOrderData.originalCustomerId === undefined) {
      delete cleanOrderData.originalCustomerId;
    }
    // For items, clean each item's originalPrice if undefined
    cleanOrderData.items = cleanOrderData.items.map(item => {
      const cleanItem = { ...item };
      if (cleanItem.originalPrice === undefined) {
        delete cleanItem.originalPrice;
      }
      if (cleanItem.productId === undefined) {
        delete cleanItem.productId;
      }
      return cleanItem;
    });

    const orderWithId = {
      ...cleanOrderData,
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
    console.log(`Updating order ${orderId} with payment ${paymentId}, status: ${status}`);
    const orderRef = ref(firebaseDatabase, `orders/${orderId}`);
    const updates = {
      paymentId,
      paymentStatus: status,
      status: status === 'paid' ? 'pending' : 'cancelled',
      paymentUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
   
    console.log('Firebase update data:', updates);
    await update(orderRef, updates);
    console.log('Firebase update successful');
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
    console.log(`💰 Wallet updated for ${affiliateId}: +₹${amount} = ₹${newBalance}`);
  } catch (error) {
    console.error('Error adding to wallet:', error);
    throw error;
  }
};

// Update Referral After Purchase
const updateReferralAfterPurchase = async (affiliateId: string, customerId: string, customerName: string, customerEmail: string, earnings: number, orderDescription: string, orderId: string): Promise<void> => {
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
      productName: orderDescription,
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
const giveCombinedReferralBonus = async (directReferrerId: string, customerName: string, orderDescription: string, orderId: string, totalAmount: number): Promise<void> => {
  try {
    // Calculate 10% commission
    const commissionAmount = Math.round(totalAmount * 0.10);
    const fixedBonusAmount = 100;
    const totalEarnings = commissionAmount + fixedBonusAmount;
    const transactionDescription = `Level 1 commission (10.0%) from ${customerName}'s purchase + ₹${fixedBonusAmount} fixed affiliate bonus`;
   
    const commissionDescription = `Combined earnings: 10% commission (₹${commissionAmount}) + ₹${fixedBonusAmount} bonus = ₹${totalEarnings} from ${customerName}'s purchase`;
    await saveCommissionRecord({
      affiliateId: directReferrerId,
      affiliateName: 'Direct Referrer',
      customerId: 'guest',
      customerName,
      customerEmail: '',
      customerPhone: '',
      orderId,
      productName: orderDescription,
      productDescription: orderDescription,
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
   
    console.log(`✅ Combined bonus given: ₹${totalEarnings} (₹${commissionAmount} + ₹${fixedBonusAmount}) to ${directReferrerId}`);
  } catch (error) {
    console.error('❌ Failed to give combined referral bonus:', error);
    throw error;
  }
};

// Process multi-level commissions
const processMultiLevelCommissions = async (buyerAffiliateId: string, orderId: string, totalAmount: number, formData: any, orderDescription: string) => {
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
        description = `Level ${level} commission (${(rate * 100).toFixed(1)}%) from ${formData.name}'s purchase + ₹${fixedBonusAmount} fixed affiliate bonus`;
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
        productName: orderDescription,
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
      console.log(`💰 Level ${level} commission: ₹${commissionAmount} (${rate * 100}% ${level === 1 ? '+ ₹100 bonus' : ''}) to ${upline.id}`);
    }
    if (chain.length > 0) {
      const directComm = Math.round(totalAmount * 0.10) + 100;
      await updateReferralAfterPurchase(chain[0].id, buyerAffiliateId, formData.name, formData.email, directComm, orderDescription, orderId);
    }
  } catch (error) {
    console.error('Multi-level commission failed:', error);
    throw error;
  }
};

// Cart Checkout Modal
interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  affiliateId?: string;
  customerId: string;
  uid?: string;
  onOrderSuccess: () => void;
  razorpayLoaded: boolean;
}

function CartCheckoutModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  affiliateId, 
  customerId, 
  uid, 
  onOrderSuccess,
  razorpayLoaded: externalRazorpayLoaded 
}: CartCheckoutModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [localRazorpayLoaded, setLocalRazorpayLoaded] = useState(externalRazorpayLoaded);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: ""
  });
  
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderDescription = `Cart Purchase (${cartItems.length} items)`;

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" });
     
      // Load Razorpay script when modal opens
      loadRazorpayScript().then((loaded) => {
        setLocalRazorpayLoaded(!!loaded);
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

  // Initiate Razorpay Payment
  const initiateRazorpayPayment = async (orderData: OrderData) => {
    if (!localRazorpayLoaded) {
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
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      name: 'SwissGain',
      description: orderDescription,
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
          await processCommissionsAfterPayment(orderId, paidOrderData);
          toast({
            title: "Payment Successful 🎉",
            description: `Order ID: ${orderId}`,
          });
          onClose();
          onOrderSuccess();
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
        customer_id: customerId,
        affiliate_id: affiliateId || 'none',
        items_count: cartItems.length
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

  // Process commissions after payment
  const processCommissionsAfterPayment = async (orderId: string, orderData: OrderData) => {
    console.log('Starting commission processing for order:', orderId);
    console.log('Order data:', orderData);
    console.log('Form data:', formData);
   
    try {
      // Combined 10% + ₹100 Bonus for Direct Referral Link
      if (affiliateId && uid !== affiliateId) {
        console.log('Checking affiliate:', affiliateId);
        const referrerSnap = await get(ref(firebaseDatabase, `affiliates/${affiliateId}`));
        console.log('Affiliate exists:', referrerSnap.exists());
       
        if (referrerSnap.exists()) {
          console.log(`🎯 Giving combined bonus to affiliate: ${affiliateId}`);
          await giveCombinedReferralBonus(affiliateId, formData.name, orderDescription, orderId, totalAmount);
        } else {
          console.log(`❌ Affiliate ${affiliateId} not found in database`);
        }
      } else {
        console.log(`ℹ️ No affiliate bonus: affiliateId=${affiliateId}, uid=${uid}`);
      }
      // Multi-level commissions (only if buyer is affiliate)
      if (uid) {
        console.log('Checking if buyer is affiliate:', uid);
        const affSnap = await get(ref(firebaseDatabase, `affiliates/${uid}`));
        console.log('Buyer affiliate check:', {
          exists: affSnap.exists(),
          isAffiliate: affSnap.exists() ? affSnap.val().isAffiliate : false
        });
       
        if (affSnap.exists() && affSnap.val().isAffiliate) {
          console.log(`🔗 Processing multi-level commissions for buyer: ${uid}`);
          await processMultiLevelCommissions(uid, orderId, totalAmount, formData, orderDescription);
        } else {
          console.log(`ℹ️ Buyer ${uid} is not an affiliate, no multi-level commissions`);
        }
      }
      console.log(`✅ All commissions processed for order: ${orderId}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast({ title: "Incomplete Form", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const purchaseCustomerId = generatePurchaseCustomerId();
      // Clean items to remove undefined properties
      const cleanItems = cartItems.map(item => {
        const cleanItem = { ...item };
        if (cleanItem.originalPrice === undefined) {
          delete cleanItem.originalPrice;
        }
        if (cleanItem.productId === undefined) {
          delete cleanItem.productId;
        }
        return cleanItem;
      });
      const orderData: OrderData = {
        items: cleanItems,
        ...(affiliateId && { affiliateId }),
        customerId: purchaseCustomerId,
        ...(customerId && { originalCustomerId: customerId }),
        totalAmount,
        customerInfo: formData,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            Secure Checkout - Cart
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-muted p-3 sm:p-4 rounded-lg">
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Order Summary</h3>
            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-40 sm:max-h-52 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-start sm:items-center space-x-2 sm:space-x-3">
                  <img 
                    src={item.images?.[0] || item.image || '/placeholder.png'} 
                    alt={item.name} 
                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                  </div>
                  <p className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 sm:pt-3">
              <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span>Subtotal:</span>
                <span>₹{totalAmount.toLocaleString()}</span>
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
            <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-2 rounded border">
              <code className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded break-all">
                {customerId}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(customerId)}
                className="text-xs"
              >
                Copy
              </Button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Full Name *</Label>
              <Input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
                placeholder="Enter your full name" 
                className="text-sm sm:text-base"
              />
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Email *</Label>
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
            
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Phone *</Label>
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
            
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Address *</Label>
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
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">City *</Label>
                <Input 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Your city" 
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">State *</Label>
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
            
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm">PIN Code *</Label>
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
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium">Secure Payment by Razorpay</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
                <span className="text-muted-foreground">Payment Methods:</span>
                <div className="flex flex-wrap gap-1">
                  <span className="bg-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border text-xs">Credit Card</span>
                  <span className="bg-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border text-xs">Debit Card</span>
                  <span className="bg-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border text-xs">UPI</span>
                  <span className="bg-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border text-xs">Net Banking</span>
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground py-2 sm:py-3 text-sm sm:text-base"
              disabled={loading || paymentLoading || !localRazorpayLoaded}
            >
              {paymentLoading ? 'Processing Payment...' :
               loading ? 'Creating Order...' :
               !localRazorpayLoaded ? 'Loading Payment...' :
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

// Get affiliate ID from URL (same as product detail)
const getAffiliateIdFromUrl = () => 
  typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('ref') || 
      new URLSearchParams(window.location.search).get('affiliate') || 
      undefined 
    : undefined;

export default function Cart() {
  const { data, updateData } = useLocalStorage();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  const affiliateId = getAffiliateIdFromUrl();
  const uid = getCookie('swissgain_uid') || undefined;
  const customerId = uid || getOrCreateCustomerId();

  // Load Razorpay script on component mount
  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setRazorpayLoaded(!!loaded);
    });
  }, []);

  const handleRemoveItem = (productId: string) => {
    updateData(removeFromCart.bind(null, productId));
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
    } else {
      updateData(updateCartQuantity.bind(null, productId, newQuantity));
    }
  };

  const handleClearCart = () => {
    updateData(clearCart);
  };

  const handleOrderSuccess = () => {
    // Clear cart after successful order
    handleClearCart();
  };

  const getTotalPrice = () => {
    return data.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return data.cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Check if Razorpay is ready before allowing checkout
  const handleCheckoutClick = () => {
    if (!razorpayLoaded) {
      // Show loading message
      alert('Payment system is loading. Please wait a moment...');
      return;
    }
    setIsCheckoutOpen(true);
  };

  if (data.cart.length === 0) {
    return (
      <div className="py-12 sm:py-16 md:py-20 bg-muted min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingCart className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-muted-foreground mb-4 sm:mb-6" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">Your Cart is Empty</h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 px-4">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link href="/products">
            <Button className="gradient-primary text-primary-foreground text-sm sm:text-base px-6 py-3">
              <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 md:py-20 bg-muted min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">Shopping Cart</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cart Items - Main Content */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {data.cart.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Product Image */}
                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover self-center sm:self-start"
                    />
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base md:text-lg line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                        {item.category}
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary mt-1 sm:mt-2">
                        ₹{item.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2 mt-2 sm:mt-0">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="flex flex-col items-end sm:items-start sm:ml-4">
                        <p className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1 sm:mb-2">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive h-8 px-2 sm:px-3"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline text-xs">Remove</span>
                          <span className="sm:hidden text-xs">×</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary - Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 sm:top-24">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl md:text-2xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 sm:pt-4">
                  <div className="flex justify-between text-base sm:text-lg md:text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Button
                    onClick={handleCheckoutClick}
                    className="w-full gradient-gold text-accent-foreground py-2.5 sm:py-3 text-sm sm:text-base"
                    disabled={!razorpayLoaded}
                  >
                    {razorpayLoaded ? 'Proceed to Checkout' : 'Loading Payment...'}
                  </Button>
                  
                  <Link href="/products">
                    <Button variant="outline" className="w-full text-sm sm:text-base py-2.5 sm:py-3">
                      Continue Shopping
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:text-destructive text-sm sm:text-base py-2.5 sm:py-3"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CartCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={data.cart}
        affiliateId={affiliateId}
        customerId={customerId}
        uid={uid}
        onOrderSuccess={handleOrderSuccess}
        razorpayLoaded={razorpayLoaded}
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