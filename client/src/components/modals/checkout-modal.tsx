'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, push, set, get, update } from 'firebase/database';
import crypto from 'crypto';

// ==================== RAZORPAY LIVE CONFIG ====================
const RAZORPAY_KEY_ID = "rzp_live_RjxoVsUGVyJUhQ";
const RAZORPAY_KEY_SECRET = "shF22XqtflD64nRd2GdzCYoT";

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

// Initialize Firebase
let database: any = null;
const initializeFirebase = () => {
  if (database) return database;
  let app;
  const apps = getApps();
  if (apps.length === 0) app = initializeApp(firebaseConfig);
  else app = apps[0];
  database = getDatabase(app);
  return database;
};
const firebaseDatabase = initializeFirebase();

// Commission Rates
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
  customerInfo: any;
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
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

// Customer ID
const generateUniqueCustomerId = () => {
  if (typeof window === 'undefined') return "default_customer";
  let id = localStorage.getItem('uniqueCustomerId');
  if (!id) {
    id = `cust_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('uniqueCustomerId', id);
    sessionStorage.setItem('uniqueCustomerId', id);
  }
  return id;
};

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

// Upline Chain
const getUplineChain = async (affiliateId: string): Promise<any[]> => {
  const chain = [];
  let current = affiliateId;
  for (let i = 0; i < 10; i++) {
    const snap = await get(ref(firebaseDatabase, `affiliates/${current}`));
    if (!snap.exists()) break;
    const user = snap.val();
    if (!user.referredById) break;
    chain.unshift({ id: user.referredById, level: i + 1, name: user.name || 'Unknown' });
    current = user.referredById;
  }
  return chain;
};

// Save Order
const saveOrderToFirebase = async (orderData: OrderData): Promise<string> => {
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
};

// Save Commission
const saveCommissionRecord = async (data: any) => {
  const commissionsRef = ref(firebaseDatabase, `commissions/${data.affiliateId}`);
  const newRef = push(commissionsRef);
  await set(newRef, { ...data, id: newRef.key, timestamp: new Date().toISOString(), status: 'completed' });
};

// Add to Wallet
const addCommissionToWallet = async (affiliateId: string, amount: number, description: string, orderId: string) => {
  const walletRef = ref(firebaseDatabase, `wallets/${affiliateId}`);
  const transactionRef = push(ref(firebaseDatabase, `transactions/${affiliateId}`));
  const snap = await get(walletRef);
  const balance = snap.exists() ? snap.val().balance || 0 : 0;
  const newBalance = balance + amount;

  await set(walletRef, { balance: newBalance, upiId: snap.val()?.upiId || '', lastUpdated: new Date().toISOString() });
  await set(transactionRef, { amount, type: 'credit', description, balanceAfter: newBalance, orderId, timestamp: new Date().toISOString(), status: 'completed' });
};

// Update Referral Stats
const updateReferralStats = async (affiliateId: string, amount: number) => {
  const statsRef = ref(firebaseDatabase, `referrals/${affiliateId}/stats`);
  const snap = await get(statsRef);
  const current = snap.exists() ? snap.val() : { totalReferrals: 0, referralEarnings: 0, totalSales: 0 };
  await set(statsRef, {
    totalReferrals: current.totalReferrals + 1,
    referralEarnings: (current.referralEarnings || 0) + amount,
    totalSales: (current.totalSales || 0) + 1
  });
};

// Direct Referral Bonus (10% + ₹100)
const giveCombinedReferralBonus = async (affiliateId: string, customerName: string, productName: string, orderId: string, amount: number) => {
  const commission = Math.round(amount * 0.10);
  const bonus = 100;
  const total = commission + bonus;
  const desc = `Level 1: 10% (₹${commission}) + ₹100 bonus from ${customerName}'s purchase`;

  await saveCommissionRecord({
    affiliateId, customerName, orderId, productName, purchaseAmount: amount,
    commissionAmount: total, commissionRate: '10% + ₹100 Bonus', level: 1, description: desc, type: 'combined_bonus'
  });
  await addCommissionToWallet(affiliateId, total, desc, orderId);
  await updateReferralStats(affiliateId, total);
};

// Multi-level Commissions
const processMultiLevelCommissions = async (buyerId: string, orderId: string, totalAmount: number, formData: any, product: any) => {
  const chain = await getUplineChain(buyerId);
  if (chain.length === 0) return;

  for (const upline of chain) {
    const rate = commissionRates[upline.level - 1];
    let amount = Math.round(totalAmount * rate);
    if (upline.level === 1) amount += 100;

    const desc = upline.level === 1
      ? `Level 1 + ₹100 bonus from ${formData.name}'s purchase`
      : `Level ${upline.level} commission`;

    await saveCommissionRecord({
      affiliateId: upline.id, affiliateName: upline.name, customerName: formData.name,
      orderId, productName: product.name, purchaseAmount: totalAmount, commissionAmount: amount,
      commissionRate: upline.level === 1 ? '10% + ₹100' : (rate * 100).toFixed(1) + '%', level: upline.level, description: desc
    });
    await addCommissionToWallet(upline.id, amount, desc, orderId);
    await updateReferralStats(upline.id, amount);
  }
};

// Load Razorpay Script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Cart Checkout Modal
interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  affiliateId?: string;
  customerId: string;
  uid?: string;
  onOrderSuccess?: () => void;
}

export default function CartCheckoutModal({
  isOpen, onClose, cartItems, affiliateId, customerId, uid, onOrderSuccess
}: CartCheckoutModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: ""
  });

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (isOpen) loadRazorpayScript();
  }, [isOpen]);

  const handlePayment = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (!(window as any).Razorpay) {
      toast({ title: "Error", description: "Payment system not loaded", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay Order (direct API call)
      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET),
        },
        body: JSON.stringify({
          amount: totalAmount * 100,
          currency: "INR",
          receipt: `cart_${Date.now()}`
        })
      });
      const order = await orderRes.json();
      if (order.error) throw new Error(order.error.description);

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "SwissGain India",
        description: "Cart Purchase",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify Signature
            const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
              .update(response.razorpay_order_id + "|" + response.razorpay_payment_id)
              .digest('hex');

            if (expected !== response.razorpay_signature) {
              throw new Error("Invalid payment signature");
            }

            // Save each cart item as separate confirmed order
            for (const item of cartItems) {
              const orderData: OrderData = {
                productId: item.id || item._id,
                affiliateId,
                customerId: uid || generateUniqueCustomerId(),
                originalCustomerId: customerId,
                productName: item.name,
                price: item.price,
                quantity: item.quantity,
                totalAmount: item.price * item.quantity,
                customerInfo: formData,
                status: 'confirmed',
                createdAt: new Date().toISOString(),
                images: item.images || [item.image],
                category: item.category || 'General',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              };

              const orderId = await saveOrderToFirebase(orderData);

              // Process commissions per product
              if (affiliateId && uid !== affiliateId) {
                const snap = await get(ref(firebaseDatabase, `affiliates/${affiliateId}`));
                if (snap.exists()) {
                  await giveCombinedReferralBonus(affiliateId, formData.name, item.name, orderId, item.price * item.quantity);
                }
              }

              if (uid) {
                const snap = await get(ref(firebaseDatabase, `affiliates/${uid}`));
                if (snap.exists() && snap.val().isAffiliate) {
                  await processMultiLevelCommissions(uid, orderId, item.price * item.quantity, formData, item);
                }
              }
            }

            toast({ title: "Payment Successful!", description: "Your cart order has been confirmed!" });
            onOrderSuccess?.();
            onClose();
          } catch (err: any) {
            toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
          }
        },
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: "#f59e0b" },
        modal: { ondismiss: () => { setLoading(false); } }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Payment failed", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout Cart ({cartItems.length} items)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg max-h-60 overflow-y-auto">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 py-2 border-b last:border-0">
                <img src={item.images?.[0] || item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">₹{item.price.toLocaleString()} × {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
            <div className="border-t pt-3 mt-3 font-bold text-lg">
              Total: ₹{totalAmount.toLocaleString()}
            </div>
          </div>

          {affiliateId && (
            <div className="bg-green-50 p-3 rounded-lg text-sm">
              Your referrer will earn 10% + ₹100 bonus on every product!
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-4">
            <div><Label>Full Name *</Label><Input name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div><Label>Email *</Label><Input name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
            <div><Label>Phone *</Label><Input name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
            <div><Label>Address *</Label><Input name="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>City *</Label><Input name="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required /></div>
              <div><Label>State *</Label><Input name="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required /></div>
            </div>
            <div><Label>PIN Code *</Label><Input name="pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required /></div>

            <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
              {loading ? "Opening Payment..." : `Pay ₹${totalAmount.toLocaleString()} via Razorpay`}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Secured by <strong>Razorpay</strong> • 256-bit encryption
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Declare Razorpay globally
declare global {
  interface Window {
    Razorpay: any;
  }
}