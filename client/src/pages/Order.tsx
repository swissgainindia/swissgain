'use client';

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Package, Clock, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
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
  uniqueOrderId?: string;
}

const getOrCreateCustomerId = () => {
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

    // Sort by createdAt descending
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

const Order = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  if (loading) {
    return (
      <div className="py-20 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Failed to load orders</h1>
          <p className="text-muted-foreground mb-4">Please try refreshing the page.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Orders</h1>
          <p className="text-muted-foreground">Track and manage your recent orders.</p>
          {customerId && (
            <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Customer ID</p>
              <code className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded">
                {customerId}
              </code>
            </div>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Your orders will appear here once you make a purchase.</p>
            <Button asChild>
              <Link href="/products">Shop Now</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{order.uniqueOrderId || order.id.slice(-6)}</CardTitle>
                    <Badge variant={statusConfig[order.status]?.color || 'default'}>
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    Placed on {format(parseISO(order.createdAt), 'MMM dd, yyyy')} • {format(parseISO(order.createdAt), 'HH:mm')}
                  </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={order.images?.[0] || '/placeholder.svg'}
                      alt={order.productName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{order.productName}</h3>
                      <p className="text-sm text-muted-foreground">Qty: {order.quantity}</p>
                      <p className="text-sm">₹{order.price.toLocaleString()} each</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{order.totalAmount.toLocaleString()}</p>
                      {order.paymentMethod === 'razorpay' && order.paymentId && (
                        <p className="text-xs text-muted-foreground">Paid via Razorpay</p>
                      )}
                    </div>
                  </div>

                  {order.status === 'delivered' && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Delivered on time</span>
                    </div>
                  )}

                  {order.status === 'pending' && (
                    <div className="flex items-center space-x-2 text-sm text-yellow-600">
                      <Clock className="h-4 w-4" />
                      <span>Processing your order</span>
                    </div>
                  )}

                  {order.status === 'shipped' && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <Truck className="h-4 w-4" />
                      <span>In transit</span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <p><strong>Ship to:</strong> {order.customerInfo.name}</p>
                    <p>{order.customerInfo.address}, {order.customerInfo.city}, {order.customerInfo.state} - {order.customerInfo.pincode}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Order;