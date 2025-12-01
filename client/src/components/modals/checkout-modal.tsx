'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, push, set, get, update } from 'firebase/database';

// Firebase Configuration (same as product detail)
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

// Commission rates (same as product detail)
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
  razorpayPayment?: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    amount: number;
    currency: string;
    status: string;
    paid_at: string;
  };
}

// Customer ID Helpers (same as product detail)
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
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};

// Upline Chain (same as product detail)
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

// Save Order (same as product detail)
const saveOrderToFirebase = async (orderData: OrderData): Promise<string> => {
  try {
    const ordersRef = ref(firebaseDatabase, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, {
      ...orderData,
      id: newOrderRef.key,
      uniqueOrderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      commissionProcessed: false,
      creditedUplines: {}
    });
    return newOrderRef.key!;
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

// Save Commission Record (same as product detail)
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

// Add to Wallet (same as product detail)
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

// Update Referral Stats (same as product detail)
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

// FIXED: Combined 10% + ₹100 Fixed Bonus for Direct Referral Link Purchase (same as product detail)
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
    
    console.log(`✅ Combined bonus given: ₹${totalEarnings} (₹${commissionAmount} + ₹${fixedBonusAmount}) to ${directReferrerId}`);
  } catch (error) {
    console.error('❌ Failed to give combined referral bonus:', error);
    throw error;
  }
};

// FIXED: Process multi-level commissions (same as product detail)
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

      console.log(`💰 Level ${level} commission: ₹${commissionAmount} (${rate * 100}% ${level === 1 ? '+ ₹100 bonus' : ''}) to ${upline.id}`);
    }
  } catch (error) {
    console.error('Multi-level commission failed:', error);
    throw error;
  }
};

// Initialize Razorpay Payment for each order
const initiateRazorpayPayment = async (totalAmount: number, formData: any, productName: string, customerId: string, onPaymentSuccess: (response: any) => Promise<void>) => {
  if (!window.Razorpay) {
    throw new Error('Razorpay not available. Please refresh the page.');
  }

  const options = {
    key: RAZORPAY_CONFIG.key_id,
    amount: totalAmount * 100, // Convert to paise
    currency: 'INR',
    name: 'SwissGain',
    description: `Cart Purchase: ${productName}`,
    image: '/logo.png',
    handler: async function (response: any) {
      console.log('Payment successful:', response);
      await onPaymentSuccess(response);
    },
    prefill: {
      name: formData.name,
      email: formData.email,
      contact: formData.phone,
    },
    notes: {
      address: 'SwissGain Cart Purchase',
      user_id: customerId,
    },
    theme: {
      color: '#b45309',
    },
    modal: {
      ondismiss: function() {
        throw new Error('Payment cancelled by user');
      }
    }
  };

  const razorpayInstance = new window.Razorpay(options);
  razorpayInstance.open();
  return true;
};

// Cart Checkout Modal Props
interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  affiliateId?: string;
  customerId: string;
  uid?: string;
  onOrderSuccess?: () => void;
  razorpayLoaded: boolean;
}

export default function CartCheckoutModal({ 
  isOpen, 
  onClose, 
  cartItems, 
  affiliateId, 
  customerId, 
  uid,
  onOrderSuccess,
  razorpayLoaded
}: CartCheckoutModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: ""
  });

  // Calculate total amount for all cart items
  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePurchaseCustomerId = () => uid || `purchase_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;

  // Complete order after successful payment
  const completeOrderAfterPayment = async (paymentResponse: any, orderData: OrderData, orderId: string) => {
    try {
      // Update order with payment details
      const updatedOrderData: OrderData = {
        ...orderData,
        status: 'confirmed',
        razorpayPayment: {
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          amount: orderData.totalAmount,
          currency: 'INR',
          status: 'completed',
          paid_at: new Date().toISOString(),
        }
      };

      // Update order in Firebase
      await update(ref(firebaseDatabase, `orders/${orderId}`), updatedOrderData);
      console.log(`✅ Payment confirmed for order: ${orderId}`);

      // Process commissions
      await processCommissions(orderId, orderData.totalAmount, formData, {
        name: orderData.productName,
        ...orderData
      });

    } catch (error) {
      console.error('❌ Order completion error:', error);
      throw error;
    }
  };

  // Process commissions after payment
  const processCommissions = async (orderId: string, totalAmount: number, formData: any, product: any) => {
    try {
      // FIXED: COMBINED 10% + ₹100 Bonus for Direct Referral Link
      if (affiliateId && uid !== affiliateId) {
        const referrerSnap = await get(ref(firebaseDatabase, `affiliates/${affiliateId}`));
        if (referrerSnap.exists()) {
          console.log(`🎯 Giving combined bonus to affiliate: ${affiliateId}`);
          await giveCombinedReferralBonus(affiliateId, formData.name, product.name, orderId, totalAmount);
        } else {
          console.log(`❌ Affiliate ${affiliateId} not found in database`);
        }
      } else {
        console.log(`ℹ️ No affiliate bonus: affiliateId=${affiliateId}, uid=${uid}`);
      }

      // FIXED: Multi-level commissions (only if buyer is affiliate)
      if (uid) {
        const affSnap = await get(ref(firebaseDatabase, `affiliates/${uid}`));
        if (affSnap.exists() && affSnap.val().isAffiliate) {
          console.log(`🔗 Processing multi-level commissions for buyer: ${uid}`);
          await processMultiLevelCommissions(uid, orderId, totalAmount, formData, product);
        } else {
          console.log(`ℹ️ Buyer ${uid} is not an affiliate, no multi-level commissions`);
        }
      }
    } catch (error) {
      console.error('❌ Commission processing error:', error);
      // Don't throw error here - payment was successful even if commissions fail
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!razorpayLoaded) {
      toast({
        title: "Payment System Loading",
        description: "Please wait a moment for payment system to load.",
        variant: "destructive",
      });
      return;
    }

    if (!window.Razorpay) {
      toast({
        title: "Payment Error",
        description: "Payment system not available. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast({ title: "Incomplete Form", description: "Please fill all fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const purchaseCustomerId = generatePurchaseCustomerId();
      const orderIds = [];

      // Process each cart item as a separate order
      for (const item of cartItems) {
        const orderData: OrderData = {
          productId: item.id,
          ...(affiliateId && { affiliateId }),
          customerId: purchaseCustomerId,
          originalCustomerId: customerId,
          productName: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          quantity: item.quantity,
          totalAmount: item.price * item.quantity,
          customerInfo: formData,
          status: 'pending', // Will be updated to 'confirmed' after payment
          createdAt: new Date().toISOString(),
          images: item.images || [item.image],
          category: item.category,
          discount: item.discount,
          productDescription: item.description,
          productFeatures: item.features,
          productBrand: item.brand || 'SwissGain',
          productRating: item.rating,
          productReviews: item.reviews
        };

        const orderId = await saveOrderToFirebase(orderData);
        orderIds.push(orderId);
        console.log(`✅ Order saved: ${orderId} for ${item.name}`);

        // Initialize Razorpay payment for this order
        await initiateRazorpayPayment(
          item.price * item.quantity,
          formData,
          item.name,
          customerId,
          async (paymentResponse) => {
            await completeOrderAfterPayment(paymentResponse, orderData, orderId);
          }
        );
      }

      // Note: The modal doesn't close immediately because Razorpay modal is open
      // The actual order completion happens in the payment handler

    } catch (error: any) {
      console.error('❌ Order placement error:', error);
      toast({
        title: error.message?.includes('Payment cancelled') ? "Payment Cancelled" : "Error",
        description: error.message?.includes('Payment cancelled') 
          ? "You cancelled the payment process." 
          : (error.message || "Failed to place order."),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-3 mb-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img 
                    src={item.images?.[0] || item.image} 
                    alt={item.name} 
                    className="w-12 h-12 object-cover rounded" 
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="font-semibold text-sm">₹{item.price.toLocaleString()} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal ({totalItems} items):</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Shipping:</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t">
                <span>Total:</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {affiliateId && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">Referral Purchase Detected</p>
              <p className="text-xs text-green-700 mt-1">
                Your referrer will earn commissions on each product in this order!
              </p>
            </div>
          )}

          {uid && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Affiliate Purchase</p>
              <p className="text-xs text-blue-700 mt-1">Your upline will earn commissions on this purchase.</p>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">Your Customer ID</p>
            <div className="mt-2 flex items-center justify-between bg-white p-2 rounded border">
              <code className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded">{customerId}</code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(customerId)}>Copy</Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input name="address" value={formData.address} onChange={handleInputChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input name="city" value={formData.city} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input name="state" value={formData.state} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>PIN Code *</Label>
              <Input name="pincode" value={formData.pincode} onChange={handleInputChange} required />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground py-3" disabled={loading || !razorpayLoaded}>
              {loading ? 'Processing...' : !razorpayLoaded ? 'Loading Payment...' : `Pay ₹${totalAmount.toLocaleString()}`}
            </Button>
          </form>

          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-green-700">
              <strong>Secure Payment:</strong> Powered by Razorpay. Your payment details are safe and encrypted.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}