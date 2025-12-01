// ProductDetail.tsx - FULLY SELF-CONTAINED WITH RAZORPAY (NO BACKEND API NEEDED)
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
import { Star, Check, ShoppingCart, Zap, Truck, RotateCcw, Shield, Plus, Minus, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, push, set, get, update } from 'firebase/database';
import crypto from 'crypto'; // Node.js crypto (works in Next.js 13+ with app router)

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

// Save Commission
const saveCommissionRecord = async (commissionData: any): Promise<void> => {
  try {
    const commissionsRef = ref(firebaseDatabase, `commissions/${commissionData.affiliateId}`);
    const newCommissionRef = push(commissionsRef);
    await set(newCommissionRef, {
      ...commissionData,
      id: newCommissionRef.key,
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
    const currentBalance = snap.exists() ? snap.val().balance || 0 : 0;
    const newBalance = currentBalance + amount;

    await set(walletRef, {
      balance: newBalance,
      upiId: snap.exists() ? snap.val().upiId || '' : '',
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

// Update Referral Stats
const updateReferralStats = async (affiliateId: string, amount: number): Promise<void> => {
  try {
    const statsRef = ref(firebaseDatabase, `referrals/${affiliateId}/stats`);
    const snap = await get(statsRef);
    const current = snap.exists() ? snap.val() : { totalReferrals: 0, referralEarnings: 0, totalSales: 0 };
    await set(statsRef, {
      totalReferrals: (current.totalReferrals || 0) + 1,
      referralEarnings: (current.referralEarnings || 0) + amount,
      totalSales: (current.totalSales || 0) + 1
    });
  } catch (error) {
    console.error('Error updating referral stats:', error);
  }
};

// Give Direct Referral Bonus (10% + ₹100)
const giveCombinedReferralBonus = async (directReferrerId: string, customerName: string, productName: string, orderId: string, totalAmount: number) => {
  const commission = Math.round(totalAmount * 0.10);
  const bonus = 100;
  const total = commission + bonus;

  const desc = `Level 1: 10% (₹${commission}) + ₹100 bonus from ${customerName}'s purchase of ${productName}`;

  await saveCommissionRecord({
    affiliateId: directReferrerId,
    affiliateName: 'Direct Referrer',
    customerName,
    orderId,
    productName,
    purchaseAmount: totalAmount,
    commissionAmount: total,
    commissionRate: '10% + ₹100 Bonus',
    level: 1,
    description: desc,
    type: 'combined_bonus',
  });

  await addCommissionToWallet(directReferrerId, total, desc, orderId);
  await updateReferralStats(directReferrerId, total);
};

// Process Multi-Level Commissions
const processMultiLevelCommissions = async (buyerAffiliateId: string, orderId: string, totalAmount: number, formData: any, product: any) => {
  const chain = await getUplineChain(buyerAffiliateId);
  if (chain.length === 0) return;

  for (const upline of chain) {
    const level = upline.level;
    const rate = commissionRates[level - 1];
    let amount = Math.round(totalAmount * rate);
    if (level === 1) amount += 100;

    const desc = level === 1
      ? `Level 1 commission + ₹100 bonus from ${formData.name}'s purchase`
      : `Level ${level} commission from ${formData.name}'s purchase`;

    await saveCommissionRecord({
      affiliateId: upline.id,
      affiliateName: upline.name,
      customerName: formData.name,
      orderId,
      productName: product.name,
      purchaseAmount: totalAmount,
      commissionAmount: amount,
      commissionRate: level === 1 ? '10% + ₹100' : (rate * 100).toFixed(1) + '%',
      level,
      description: desc,
    });

    await addCommissionToWallet(upline.id, amount, desc, orderId);
    await updateReferralStats(upline.id, amount);
  }
};

// Load Razorpay Script
const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
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

// Checkout Modal with Full Razorpay Inside
function CheckoutModal({ isOpen, onClose, product, quantity, affiliateId, customerId, uid }: any) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: ""
  });

  const totalAmount = product.price * quantity;

  const handlePayment = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast({ title: "Error", description: "Failed to load payment gateway", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      // Create order directly using Razorpay API (client-side allowed with secret)
      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa(RAZORPAY_KEY_ID + ":" + RAZORPAY_KEY_SECRET),
        },
        body: JSON.stringify({
          amount: totalAmount * 100, // paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        }),
      });

      const order = await orderResponse.json();
      if (order.error) throw new Error(order.error.description);

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "SwissGain India",
        description: `Purchase of ${product.name}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify signature
            const expectedSignature = crypto
              .createHmac("sha256", RAZORPAY_KEY_SECRET)
              .update(response.razorpay_order_id + "|" + response.razorpay_payment_id)
              .digest("hex");

            if (expectedSignature !== response.razorpay_signature) {
              throw new Error("Invalid payment signature");
            }

            // Save Order
            const orderData: OrderData = {
              productId: product._id,
              affiliateId,
              customerId: uid || generateUniqueCustomerId(),
              originalCustomerId: customerId,
              productName: product.name,
              price: product.price,
              quantity,
              totalAmount,
              customerInfo: formData,
              status: 'confirmed',
              createdAt: new Date().toISOString(),
              images: product.images,
              category: product.category,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            const orderId = await saveOrderToFirebase(orderData);

            // Process Commissions
            if (affiliateId && uid !== affiliateId) {
              const snap = await get(ref(firebaseDatabase, `affiliates/${affiliateId}`));
              if (snap.exists()) {
                await giveCombinedReferralBonus(affiliateId, formData.name, product.name, orderId, totalAmount);
              }
            }

            if (uid) {
              const snap = await get(ref(firebaseDatabase, `affiliates/${uid}`));
              if (snap.exists() && snap.val().isAffiliate) {
                await processMultiLevelCommissions(uid, orderId, totalAmount, formData, product);
              }
            }

            toast({ title: "Success!", description: "Payment successful & order confirmed!" });
            onClose();
          } catch (err: any) {
            toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#f59e0b" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Payment failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Complete Your Purchase</DialogTitle></DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="flex items-center gap-3 mb-3">
              <img src={product.images[0]} alt={product.name} className="w-16 h-16 rounded object-cover" />
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">₹{product.price.toLocaleString()} × {quantity}</p>
              </div>
            </div>
            <div className="border-t pt-3 text-lg font-bold">
              Total: ₹{totalAmount.toLocaleString()}
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div><Label>Full Name *</Label><Input name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div><Label>Email *</Label><Input name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div>
            <div><Label>Phone *</Label><Input name="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div>
            <div><Label>Address *</Label><Input name="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>City *</Label><Input name="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required /></div>
              <div><Label>State *</Label><Input name="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required /></div>
            </div>
            <div><Label>PIN Code *</Label><Input name="pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required /></div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : `Pay ₹${totalAmount.toLocaleString()} via Razorpay`}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400?text=No+Image';
const BASE_IMAGE_URL = 'https://swissgainindia.com';

export default function ProductDetail() {
  const [, params] = useRoute('/product/:id');
  const productId = params?.id;
  const affiliateId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') || new URLSearchParams(window.location.search).get('affiliate') || undefined : undefined;
  const uid = getCookie('swissgain_uid') || undefined;
  const customerId = uid || getOrCreateCustomerId();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const { updateData } = useLocalStorage();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        const res = await axios.get(`/api/products/${productId}`);
        const p = res.data;
        const images = [p.image, ...(p.images || [])].filter(Boolean).map((img: string) => img.startsWith('http') ? img : `${BASE_IMAGE_URL}${img}`);
        setProduct({ ...p, images: images.length > 0 ? images : [FALLBACK_IMAGE] });

        const related = await axios.get(`/api/products?category=${p.category}`);
        setRelatedProducts(related.data.filter((x: any) => x._id !== p._id).slice(0, 4));
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleBuyNow = () => {
    setIsCheckoutOpen(true);
  };

  if (loading) return <div className="py-20 text-center">Loading...</div>;
  if (error || !product) return <div className="py-20 text-center">Product not found</div>;

  return (
    <div className="py-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Your existing product UI here - unchanged */}
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <img src={product.images[0]} alt={product.name} className="w-full h-96 object-cover rounded-xl" />
          </div>
          <div className="space-y-8">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <p className="text-3xl font-bold text-orange-600">₹{product.price.toLocaleString()}</p>
            <p className="text-lg text-gray-600">{product.description}</p>

            <div className="flex items-center gap-4">
              <Button onClick={handleBuyNow} className="flex-1 text-lg py-6 bg-orange-600 hover:bg-orange-700">
                Buy Now
              </Button>
            </div>
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
    </div>
  );
}