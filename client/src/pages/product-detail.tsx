// Updated ProductDetail Component with Fixed Commission Handling and Razorpay
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
import { Star, Check, ShoppingCart, Zap, Truck, RotateCcw, Shield, Plus, Minus, Heart, Share2, ArrowLeft } from 'lucide-react';
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

    await update(walletRef, {
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

// FIXED: Combined 10% + ₹100 Fixed Bonus for Direct Referral Link Purchase
const giveCombinedReferralBonus = async (directReferrerId: string, customerName: string, productName: string, orderId: string, totalAmount: number): Promise<void> => {
  try {
    // Calculate 10% commission
    const commissionAmount = Math.round(totalAmount * 0.10);
    const fixedBonusAmount = 100;
    const totalEarnings = commissionAmount + fixedBonusAmount;

    // FIXED: Create proper description for transaction display
    const transactionDescription = `Level 1 commission (10.0%) from ${customerName}'s purchase of ${productName} + ₹${fixedBonusAmount} fixed affiliate bonus`;
    
    const commissionDescription = `Combined earnings: 10% commission (₹${commissionAmount}) + ₹${fixedBonusAmount} bonus = ₹${totalEarnings} from ${customerName}'s purchase of ${productName}`;

    // Save commission record for the combined earnings
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
      level: 1, // FIXED: Set level to 1 for proper display
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

    // FIXED: Add combined amount to wallet with proper description
    await addCommissionToWallet(directReferrerId, totalEarnings, transactionDescription, orderId);
    
    // Update referral stats with total earnings
    await updateReferralStats(directReferrerId, totalEarnings);
    
    console.log(`✅ Combined bonus given: ₹${totalEarnings} (₹${commissionAmount} + ₹${fixedBonusAmount}) to ${directReferrerId}`);
  } catch (error) {
    console.error('❌ Failed to give combined referral bonus:', error);
    throw error;
  }
};

// FIXED: Process multi-level commissions with proper descriptions and ₹100 bonus for Level 1
const processMultiLevelCommissions = async (buyerAffiliateId: string, orderId: string, totalAmount: number, formData: any, product: any) => {
  try {
    const chain = await getUplineChain(buyerAffiliateId);
    if (chain.length === 0) return;

    const creditedUplines = chain.reduce((acc, u) => ({ ...acc, [u.id]: true }), {});
    await update(ref(firebaseDatabase, `orders/${orderId}`), { creditedUplines });

    for (const upline of chain) {
      const level = upline.level;
      const rate = commissionRates[level - 1];
      
      // FIXED: Add ₹100 bonus for Level 1 commissions
      let commissionAmount = Math.round(totalAmount * rate);
      let fixedBonusAmount = 0;
      
      if (level === 1) {
        fixedBonusAmount = 100;
        commissionAmount += fixedBonusAmount;
      }
      
      // FIXED: Create proper description that includes the bonus
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
        // FIXED: Include breakdown for Level 1
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

    // FIXED: Update referral after purchase for Level 1 with total earnings including bonus
    if (chain.length > 0) {
      const directComm = Math.round(totalAmount * 0.10) + 100;
      await updateReferralAfterPurchase(chain[0].id, buyerAffiliateId, formData.name, formData.email, directComm, product.name, orderId);
    }
  } catch (error) {
    console.error('Multi-level commission failed:', error);
    throw error;
  }
};

// Checkout Modal
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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: ""
  });
  const totalAmount = product.price * quantity;

  // Load Razorpay script when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" });
      
      // Load Razorpay script
      loadRazorpayScript().then((loaded) => {
        setRazorpayLoaded(!!loaded);
      });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePurchaseCustomerId = () => uid || `purchase_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;

  // Initialize Razorpay Payment
  const initiateRazorpayPayment = async (orderData: OrderData, orderId: string) => {
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
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      name: 'SwissGain',
      description: `Purchase: ${product.name}`,
      image: '/logo.png',
      handler: async function (response: any) {
        console.log('Payment successful:', response);
        await completeOrderAfterPayment(response, orderData, orderId);
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      notes: {
        address: 'SwissGain Product Purchase',
        user_id: customerId,
        order_id: orderId,
        product: product.name
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

  // FIXED: Complete order after successful payment with better error handling
  const completeOrderAfterPayment = async (paymentResponse: any, orderData: OrderData, orderId: string) => {
    try {
      console.log('Starting order completion process...');
      
      // Create updated order data with payment details
      const updatedOrderData = {
        ...orderData,
        status: 'confirmed',
        razorpayPayment: {
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          amount: totalAmount,
          currency: 'INR',
          status: 'completed',
          paid_at: new Date().toISOString(),
        },
        paymentStatus: 'completed',
        paymentMethod: 'razorpay',
        updatedAt: new Date().toISOString()
      };

      // FIXED: Use the correct order path - update the specific order by its ID
      const orderRef = ref(firebaseDatabase, `orders/${orderId}`);
      await update(orderRef, updatedOrderData);
      console.log(`✅ Payment confirmed for order: ${orderId}`);

      // Process commissions in background (don't block the success message)
      setTimeout(async () => {
        try {
          await processCommissions(orderId, totalAmount, formData, product);
          console.log(`✅ Commissions processed for order: ${orderId}`);
        } catch (commissionError) {
          console.error('❌ Commission processing error (non-critical):', commissionError);
          // Non-critical error - commissions can be processed later
        }
      }, 1000);

      // Show success message
      toast({
        title: "Payment Successful! 🎉",
        description: `Your order has been confirmed. Order ID: ${orderId.slice(0, 8)}...`,
        duration: 5000,
      });

      // Reset form
      setFormData({ name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" });
      setLoading(false);
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
        // Optionally redirect to order confirmation page
        // window.location.href = `/order-confirmation/${orderId}`;
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Order completion error:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Show user-friendly error message
      toast({
        title: "Payment Processing Issue",
        description: "Payment was successful but we encountered an issue updating your order. Please contact support with your payment ID.",
        variant: "destructive",
        duration: 10000,
      });
      
      // Still close the modal but show additional instructions
      setTimeout(() => {
        onClose();
        // Show a modal with contact info
        alert(`Payment was successful but order update failed. Please contact support with:\nPayment ID: ${paymentResponse.razorpay_payment_id}\nOrder ID: ${orderId}`);
      }, 5000);
    }
  };

  // Process commissions after payment
  const processCommissions = async (orderId: string, totalAmount: number, formData: any, product: any) => {
    try {
      console.log('Starting commission processing...');
      
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
      
      console.log('✅ Commission processing completed');
    } catch (error) {
      console.error('❌ Commission processing error:', error);
      // Don't throw error here - payment was successful even if commissions fail
      // We'll log it but not show to user
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast({ 
        title: "Incomplete Form", 
        description: "Please fill all required fields.", 
        variant: "destructive" 
      });
      return;
    }

    // Validate phone number
    if (formData.phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Creating order...');
      const purchaseCustomerId = generatePurchaseCustomerId();
      const orderData: OrderData = {
        productId: product._id,
        ...(affiliateId && { affiliateId }),
        customerId: purchaseCustomerId,
        originalCustomerId: customerId,
        productName: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity,
        totalAmount,
        customerInfo: formData,
        status: 'pending', // Will be updated to 'confirmed' after payment
        createdAt: new Date().toISOString(),
        images: product.images,
        category: product.category,
        discount: product.discount,
        productDescription: product.description,
        productFeatures: product.features,
        productBrand: product.brand || 'SwissGain',
        productRating: product.rating,
        productReviews: product.reviews
      };

      const orderId = await saveOrderToFirebase(orderData);
      console.log(`✅ Order saved: ${orderId}`);

      // Initialize Razorpay payment
      const paymentInitiated = await initiateRazorpayPayment(orderData, orderId);
      
      if (!paymentInitiated) {
        setLoading(false);
      }
      // Note: Don't close modal here - wait for payment completion

    } catch (error: any) {
      console.error('❌ Order placement error:', error);
      toast({
        title: "Error Creating Order",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !loading) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="flex items-center space-x-3 mb-3">
              <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">Quantity: {quantity}</p>
                <p className="font-semibold">₹{product.price.toLocaleString()} each</p>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal:</span>
                <span>₹{(product.price * quantity).toLocaleString()}</span>
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
                Your referrer will earn 10% commission + ₹100 bonus = ₹{Math.round(totalAmount * 0.10) + 100} on this purchase!
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
              <Input name="name" value={formData.name} onChange={handleInputChange} required 
                placeholder="Enter your full name" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required 
                placeholder="Enter your email address" />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required 
                placeholder="Enter 10-digit phone number" maxLength={10} />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input name="address" value={formData.address} onChange={handleInputChange} required 
                placeholder="Enter your complete address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <Input name="city" value={formData.city} onChange={handleInputChange} required 
                  placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input name="state" value={formData.state} onChange={handleInputChange} required 
                  placeholder="State" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>PIN Code *</Label>
              <Input name="pincode" value={formData.pincode} onChange={handleInputChange} required 
                placeholder="6-digit PIN code" maxLength={6} />
            </div>
            
            <Button 
              type="submit" 
              className="w-full gradient-primary text-primary-foreground py-3 text-lg font-semibold" 
              disabled={loading || !razorpayLoaded}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : !razorpayLoaded ? 'Loading Payment...' : `Pay ₹${totalAmount.toLocaleString()}`}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              By proceeding, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Secure Payment</p>
                <p className="text-xs text-green-700">
                  Powered by Razorpay. Your payment details are encrypted and secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400?text=No+Image+Available';
const BASE_IMAGE_URL = 'http://localhost:5000';

export default function ProductDetail() {
  const [, params] = useRoute('/product/:id');
  const productId = params?.id;
  const getAffiliateIdFromUrl = () => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') || new URLSearchParams(window.location.search).get('affiliate') || undefined : undefined;
  const affiliateId = getAffiliateIdFromUrl();
  const uid = getCookie('swissgain_uid') || undefined;
  const customerId = uid || getOrCreateCustomerId();

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
          const mainImage = res.data.image ? (res.data.image.startsWith('http') ? res.data.image : `${BASE_IMAGE_URL}${res.data.image}`) : null;
          const additionalImages = res.data.images ? (Array.isArray(res.data.images) ? res.data.images : res.data.images.split(',').map((s: string) => s.trim())) : [];
          const allImages = [mainImage, ...additionalImages.filter(Boolean).map((img: string) => img.startsWith('http') ? img : `${BASE_IMAGE_URL}${img}`)].filter(Boolean);
          setProduct({
            ...res.data,
            images: allImages.length > 0 ? allImages : [FALLBACK_IMAGE],
            affiliateId
          });

          const relatedRes = await axios.get(`/api/products?category=${res.data.category}`);
          setRelatedProducts(relatedRes.data.filter((p: any) => p._id !== res.data._id).slice(0, 4).map((p: any) => {
            const pImages = [p.image ? (p.image.startsWith('http') ? p.image : `${BASE_IMAGE_URL}${p.image}`) : null, ...(p.images || []).map((img: string) => img.startsWith('http') ? img : `${BASE_IMAGE_URL}${img}`)].filter(Boolean);
            return { ...p, images: pImages.length > 0 ? pImages : [FALLBACK_IMAGE] };
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

  const handleAddToCart = () => {
    if (!product) return;
    updateData(addProductToCart.bind(null, product, quantity));
    toast({ 
      title: 'Added to Cart', 
      description: `${quantity} ${product.name}(s) added to your cart.` 
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsCheckoutOpen(true);
  };

  if (loading) return (
    <div className="py-20 text-center text-xl">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      Loading product...
    </div>
  );
  
  if (error || !product) return (
    <div className="py-20 bg-white min-h-screen flex items-center justify-center text-center">
      <div>
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary">Home</Link> <span>/</span>
          <Link href="/products" className="hover:text-primary">Products</Link> <span>/</span>
          <span className="capitalize">{product.category}</span> <span>/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          <div className="space-y-4">
            <div className="relative">
              <img 
                src={product.images[selectedImageIndex] || FALLBACK_IMAGE} 
                alt={product.name} 
                className="rounded-xl shadow-lg w-full h-96 object-cover" 
                onError={(e) => e.currentTarget.src = FALLBACK_IMAGE} 
              />
              {product.discount && (
                <Badge variant="destructive" className="absolute top-4 left-4 text-lg px-3 py-1">
                  {product.discount}% OFF
                </Badge>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    className={`rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === i ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImageIndex(i)}
                  >
                    <img 
                      src={img} 
                      alt={`Product view ${i + 1}`} 
                      className="h-20 w-full object-cover"
                      onError={(e) => e.currentTarget.src = FALLBACK_IMAGE} 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <Badge variant="outline" className="mb-4 capitalize">{product.category}</Badge>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-4xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                    <Badge variant="destructive">
                      Save ₹{(product.originalPrice - product.price).toLocaleString()}
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating || 0) 
                          ? 'fill-current text-accent text-yellow-500' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-muted-foreground">
                  ({(product.rating || 0).toFixed(1)} from {product.reviews || 0} reviews)
                </span>
              </div>
              <p className="text-muted-foreground text-lg mb-6">{product.description}</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border rounded-lg">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                    className="w-16 text-center border-0" 
                    min="1"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleAddToCart} 
                  className="flex-1 gradient-primary text-primary-foreground py-3" 
                  size="lg"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                <Button 
                  onClick={handleBuyNow} 
                  className="flex-1 gradient-gold text-accent-foreground py-3" 
                  size="lg"
                >
                  <Zap className="mr-2 h-5 w-5" /> Buy Now
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">30-Day Returns</p>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="features" className="mb-16">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="features" className="mt-8">
            <div className="bg-muted rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Product Features</h3>
              <ul className="space-y-3">
                {product.features?.length > 0 ? (
                  product.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">No features available</li>
                )}
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
          <TabsContent value="reviews" className="mt-8">
            <div className="bg-muted rounded-lg p-6 text-center py-8">
              <div className="text-4xl mb-2">{(product.rating || 0).toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating || 0) 
                        ? 'fill-current text-accent text-yellow-500' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <p className="text-muted-foreground">Based on {product.reviews || 0} reviews</p>
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

        <div className="bg-gradient-to-r from-primary to-yellow-700 rounded-2xl p-8 text-white text-center mt-16">
          <h3 className="text-2xl font-bold mb-4">Interested in Earning?</h3>
          <p className="mb-6 max-w-2xl mx-auto">
            Join our affiliate program and earn commissions on every sale!
          </p>
          <Link href="/affiliate">
            <Button variant="outline" className="border-white hover:bg-white text-primary">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={product}
        quantity={quantity}
        affiliateId={affiliateId}
        customerId={customerId}
        uid={uid}
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