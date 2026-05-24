import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users, TrendingUp, Target, CreditCard, BarChart3 } from "lucide-react";

// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

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
  if (database) {
    return database;
  }

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

interface DashboardStats {
  // Order Statistics
  totalOrders: number;
  totalRevenue: number;
  monthlyOrders: number;
  monthlyRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  
  // Affiliate Statistics
  totalAffiliates: number;
  activeAffiliates: number;
  totalAffiliateSales: number;
  totalAffiliateCommission: number;
  monthlyAffiliateCommission: number;
  
  // Product Statistics
  totalProducts: number;
  productsWithAffiliateSales: number;
  
  // User Statistics
  totalCustomers: number;
  newCustomersThisMonth: number;
  
  // Performance Metrics
  affiliateConversionRate: number;
  averageOrderValue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    monthlyOrders: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalAffiliateSales: 0,
    totalAffiliateCommission: 0,
    monthlyAffiliateCommission: 0,
    totalProducts: 0,
    productsWithAffiliateSales: 0,
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    affiliateConversionRate: 0,
    averageOrderValue: 0
  });
  
  const [loading, setLoading] = useState(true);

  const firebaseDatabase = initializeFirebase();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      // Load orders data
      const ordersRef = ref(firebaseDatabase, 'orders');
      const ordersUnsubscribe = onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
          const ordersData = snapshot.val();
          const ordersArray = Object.values(ordersData) as any[];
          
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          const monthlyOrders = ordersArray.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
          });
          
          const totalRevenue = ordersArray.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          
          const affiliateSales = ordersArray.filter(order => order.affiliateId);
          const monthlyAffiliateSales = monthlyOrders.filter(order => order.affiliateId);
          
          const totalAffiliateCommission = affiliateSales.reduce((sum, order) => sum + (order.commission || 100), 0);
          const monthlyAffiliateCommission = monthlyAffiliateSales.reduce((sum, order) => sum + (order.commission || 100), 0);
          
          setStats(prev => ({
            ...prev,
            totalOrders: ordersArray.length,
            totalRevenue,
            monthlyOrders: monthlyOrders.length,
            monthlyRevenue,
            pendingOrders: ordersArray.filter(order => order.status === 'pending').length,
            processingOrders: ordersArray.filter(order => order.status === 'confirmed').length,
            deliveredOrders: ordersArray.filter(order => order.status === 'delivered').length,
            cancelledOrders: ordersArray.filter(order => order.status === 'cancelled').length,
            totalAffiliateSales: affiliateSales.length,
            totalAffiliateCommission,
            monthlyAffiliateCommission,
            averageOrderValue: ordersArray.length > 0 ? totalRevenue / ordersArray.length : 0,
            affiliateConversionRate: ordersArray.length > 0 ? (affiliateSales.length / ordersArray.length) * 100 : 0
          }));
        }
      });

      // Load affiliates data
      const affiliatesRef = ref(firebaseDatabase, 'affiliatesList');
      const affiliatesUnsubscribe = onValue(affiliatesRef, (snapshot) => {
        if (snapshot.exists()) {
          const affiliatesData = snapshot.val();
          const affiliatesArray = Object.values(affiliatesData) as any[];
          
          setStats(prev => ({
            ...prev,
            totalAffiliates: affiliatesArray.length,
            activeAffiliates: affiliatesArray.filter(affiliate => affiliate.status === 'active').length
          }));
        }
      });

      // Load affiliates products data
      const affiliatesProductsRef = ref(firebaseDatabase, 'affiliates');
      const affiliatesProductsUnsubscribe = onValue(affiliatesProductsRef, (snapshot) => {
        if (snapshot.exists()) {
          const affiliatesData = snapshot.val();
          let uniqueProducts = new Set();
          
          Object.values(affiliatesData).forEach((affiliate: any) => {
            if (affiliate.products) {
              Object.keys(affiliate.products).forEach(productId => {
                uniqueProducts.add(productId);
              });
            }
          });
          
          setStats(prev => ({
            ...prev,
            productsWithAffiliateSales: uniqueProducts.size
          }));
          setLoading(false);
        }
      });

      // Load customers from orders
      const customersUnsubscribe = onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
          const ordersData = snapshot.val();
          const ordersArray = Object.values(ordersData) as any[];
          
          const uniqueCustomers = new Set(ordersArray.map(order => order.customerId).filter(Boolean));
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          const newCustomersThisMonth = ordersArray.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.getMonth() === currentMonth && 
                   orderDate.getFullYear() === currentYear &&
                   !ordersArray.some(prevOrder => 
                     prevOrder.customerId === order.customerId && 
                     new Date(prevOrder.createdAt) < new Date(order.createdAt)
                   );
          }).length;
          
          setStats(prev => ({
            ...prev,
            totalCustomers: uniqueCustomers.size,
            newCustomersThisMonth
          }));
        }
      });

      return () => {
        ordersUnsubscribe();
        affiliatesUnsubscribe();
        affiliatesProductsUnsubscribe();
        customersUnsubscribe();
      };
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard statistics from Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-2">
          Real-time statistics from your Firebase database
        </p>
      </div>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₹{stats.monthlyRevenue.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.monthlyOrders} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAffiliateSales}</div>
            <p className="text-xs text-muted-foreground">
              {stats.affiliateConversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAffiliates} active affiliates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affiliate Commission</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalAffiliateCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ₹{stats.monthlyAffiliateCommission.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newCustomersThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Tracked</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsWithAffiliateSales}</div>
            <p className="text-xs text-muted-foreground">
              With affiliate sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.averageOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Orders</CardTitle>
            <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.processingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped Orders</CardTitle>
            <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.processingOrders}</div>
            <p className="text-xs text-muted-foreground">
              In transit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered Orders</CardTitle>
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.deliveredOrders}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled Orders</CardTitle>
            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.cancelledOrders}</div>
            <p className="text-xs text-muted-foreground">
              Cancelled orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Affiliate Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Affiliate Conversion Rate</span>
                <span className="text-lg font-bold text-primary">
                  {stats.affiliateConversionRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Affiliates</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.activeAffiliates} / {stats.totalAffiliates}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Affiliate Sales Ratio</span>
                <span className="text-lg font-bold text-blue-600">
                  {stats.totalOrders > 0 ? ((stats.totalAffiliateSales / stats.totalOrders) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Growth</span>
                <span className="text-lg font-bold text-green-600">
                  +{stats.monthlyOrders} orders
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Customer Acquisition</span>
                <span className="text-lg font-bold text-blue-600">
                  +{stats.newCustomersThisMonth} new
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Revenue per Affiliate</span>
                <span className="text-lg font-bold text-purple-600">
                  ₹{stats.totalAffiliates > 0 ? (stats.totalRevenue / stats.totalAffiliates).toFixed(0) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
        <CardHeader>
          <CardTitle>System Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Total System Value: </span>
              <span className="font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium">Affiliate Contribution: </span>
              <span className="font-bold text-green-600">
                ₹{stats.totalAffiliateCommission.toLocaleString()} ({(stats.totalAffiliateCommission / stats.totalRevenue * 100).toFixed(1)}%)
              </span>
            </div>
            <div>
              <span className="font-medium">Network Health: </span>
              <span className="font-bold text-blue-600">
                {stats.activeAffiliates > 0 ? 'Active' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}