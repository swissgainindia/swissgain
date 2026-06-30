'use client';

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Truck, Package, Clock, CheckCircle, XCircle, CreditCard, Star, PenTool } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, push, set, update } from 'firebase/database';
import { format, parseISO } from 'date-fns';

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
    let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    database = getDatabase(app);
    return database;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};
const firebaseDatabase = initializeFirebase();

interface OrderData {
  id: string;
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
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentId?: string;
  uniqueOrderId?: string;
  hasReviewed?: boolean; // New Field
}

const getOrCreateCustomerId = () => {
  if (typeof window === 'undefined') return "default_customer";
  let customerId = localStorage.getItem('uniqueCustomerId');
  if (!customerId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    customerId = `cust_${timestamp}_${randomStr}`;
    localStorage.setItem('uniqueCustomerId', customerId);
  }
  return customerId;
};

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : null;
};

const getOrdersByCustomer = async (customerId: string): Promise<OrderData[]> => {
  try {
    const ordersRef = ref(firebaseDatabase, 'orders');
    const snapshot = await get(ordersRef);
    if (!snapshot.exists()) return [];

    const allOrders: { [key: string]: OrderData } = snapshot.val() || {};
    const userOrders = Object.values(allOrders).filter((order: OrderData) => 
      order.customerId === customerId || order.originalCustomerId === customerId
    );
    return userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

const statusConfig = {
  pending: { label: 'Pending', color: 'default' },
  confirmed: { label: 'Confirmed', color: 'secondary' },
  shipped: { label: 'Shipped', color: 'accent' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'destructive' },
};

// --- Review Modal Component ---
interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isSubmitting: boolean;
  productName: string;
}

function ReviewModal({ isOpen, onClose, onSubmit, isSubmitting, productName }: ReviewModalProps) {
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
      <DialogContent className="sm:max-w-[425px] mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Review {productName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-4">
            <Label className="text-sm sm:text-base">Your Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 sm:h-8 sm:w-8 cursor-pointer transition-colors ${
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm sm:text-base">Your Experience</Label>
            <textarea
              id="comment"
              className="flex min-h-[80px] sm:min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base"
              placeholder="What did you like or dislike?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary text-white hover:bg-primary/90 text-sm sm:text-base" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const Order = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { toast } = useToast();

  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const uid = getCookie('swissgain_uid') || undefined;
  const customerId = uid || getOrCreateCustomerId();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userOrders = await getOrdersByCustomer(customerId);
        setOrders(userOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [customerId]);

  const handleOpenReview = (order: OrderData) => {
    setSelectedOrder(order);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!selectedOrder || !uid) return;
    setIsSubmittingReview(true);

    try {
      // 1. Push review to the Product's review node (matches ProductDetail logic)
      const reviewData = {
        userId: uid,
        userName: selectedOrder.customerInfo.name || "Verified Buyer",
        rating,
        comment,
        createdAt: new Date().toISOString(),
        productId: selectedOrder.productId,
        productName: selectedOrder.productName,
      };
      
      const newReviewRef = push(ref(firebaseDatabase, `reviews/${selectedOrder.productId}`));
      await set(newReviewRef, reviewData);

      // 2. Mark this specific order as reviewed
      const orderRef = ref(firebaseDatabase, `orders/${selectedOrder.id}`);
      await update(orderRef, { hasReviewed: true });

      // 3. Update local state to reflect change immediately
      setOrders(prevOrders => prevOrders.map(o => 
        o.id === selectedOrder.id ? { ...o, hasReviewed: true } : o
      ));

      toast({
        title: "Review Submitted",
        description: "Your review is now live on the product page.",
      });
      setReviewModalOpen(false);
    } catch (error) {
      console.error("Review failed:", error);
      toast({
        title: "Error",
        description: "Could not submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 sm:py-12 md:py-20 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 sm:h-28 md:h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 sm:py-12 md:py-20 bg-white min-h-screen flex items-center justify-center text-center px-4">
        <div className="max-w-md">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">Failed to load orders</h1>
          <Button onClick={() => window.location.reload()} size="lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 md:py-20 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Your Orders</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Track and manage your recent orders.
          </p>
          {customerId && (
            <div className="mt-3 sm:mt-4 bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200 inline-block max-w-full overflow-hidden">
              <span className="text-xs sm:text-sm font-medium text-blue-800 mr-2">Customer ID:</span>
              <code className="text-xs text-blue-700 font-mono break-all">
                {customerId}
              </code>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3">No orders yet</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Start shopping to see your orders here
            </p>
            <Button asChild size="lg">
              <Link href="/products">Shop Now</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-2 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg md:text-xl truncate">
                        Order #{order.uniqueOrderId || order.id.slice(-6)}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {format(parseISO(order.createdAt), 'MMM dd, yyyy • HH:mm')}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={statusConfig[order.status]?.color as any || 'default'}
                      className="self-start sm:self-center mt-1 sm:mt-0 text-xs sm:text-sm"
                    >
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 sm:pt-6 space-y-4 px-4 sm:px-6">
                  {/* Product Info Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Product Image */}
                    <Link 
                      href={`/product/${order.productId}`}
                      className="self-center sm:self-start"
                    >
                      <img loading="lazy"
                        src={order.images?.[0] || '/placeholder.svg'}
                        alt={order.productName}
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/product/${order.productId}`} 
                        className="hover:underline block mb-1 sm:mb-2"
                      >
                        <h3 className="font-semibold text-sm sm:text-base md:text-lg truncate">
                          {order.productName}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2">
                        <span>Qty: {order.quantity}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>₹{order.price.toLocaleString()} each</span>
                      </div>
                      <p className="text-sm sm:text-base font-semibold">
                        ₹{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Review Button & Price */}
                    <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                      <div className="flex justify-between sm:block">
                        <p className="text-sm sm:text-base font-semibold sm:hidden">
                          Total: ₹{order.totalAmount.toLocaleString()}
                        </p>
                        {/* Review Action Button */}
                        {(order.status === 'delivered' || order.status === 'confirmed') && (
                          <div className="mt-1 sm:mt-2">
                            {order.hasReviewed ? (
                              <Badge 
                                variant="outline" 
                                className="text-green-600 border-green-200 bg-green-50 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1 inline"/> Reviewed
                              </Badge>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="h-7 sm:h-8 text-xs"
                                onClick={() => handleOpenReview(order)}
                              >
                                <PenTool className="h-3 w-3 mr-1 hidden sm:inline"/> 
                                <span className="sm:ml-1">Write Review</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Helper Text */}
                  {(order.status === 'delivered' || order.status === 'shipped') && (
                    <div className={`flex items-center space-x-2 text-sm ${
                      order.status === 'delivered' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {order.status === 'delivered' ? (
                        <>
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          <span>Delivered on time</span>
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 flex-shrink-0" />
                          <span>In transit</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Customer Info */}
                  <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <p className="font-medium">Ship to: {order.customerInfo.name}</p>
                    <p className="break-words">
                      {order.customerInfo.address}, {order.customerInfo.city}, {order.customerInfo.state} - {order.customerInfo.pincode}
                    </p>
                    {order.paymentMethod && (
                      <p className="flex items-center gap-1 mt-1">
                        <CreditCard className="h-3 w-3" />
                        Payment: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'} • 
                        <span className={`ml-1 ${
                          order.paymentStatus === 'paid' ? 'text-green-600' : 
                          order.paymentStatus === 'pending' ? 'text-amber-600' : 
                          'text-red-600'
                        }`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal 
        isOpen={reviewModalOpen} 
        onClose={() => setReviewModalOpen(false)} 
        onSubmit={handleSubmitReview} 
        isSubmitting={isSubmittingReview}
        productName={selectedOrder?.productName || 'Product'}
      />
    </div>
  );
};

export default Order;