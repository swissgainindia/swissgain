import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Download, Eye, DollarSign, Users, TrendingUp, Calendar, User, Copy } from "lucide-react";

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, query, orderByChild, equalTo } from 'firebase/database';

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
let app;
let database;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'AffiliateSalesApp');
    database = getDatabase(app);
  } else {
    console.error('Firebase initialization error:', error);
  }
}

interface AffiliateSale {
  id: string;
  productId: string;
  affiliateId: string;
  customerId: string;
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
  commission: number;
}

interface AffiliateProduct {
  productId: string;
  affiliateId: string;
  customerId: string;
  productName: string;
  price: number;
  commission: number;
  clicks: number;
  sales: number;
  createdAt: string;
  lastAccessed: string;
}

// Function to get URL parameters
const getUrlParams = () => {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
};

// Function to get affiliate ID from localStorage or URL
const getAffiliateId = () => {
  // First check URL parameters
  const urlParams = getUrlParams();
  const urlAffiliateId = urlParams.get('affiliate');
  if (urlAffiliateId) return urlAffiliateId;

  // Then check localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userUniqueId') || localStorage.getItem('uniqueCustomerId') || "default_user";
  }

  return "default_user";
};

export default function AffiliateSales() {
  const [sales, setSales] = useState<AffiliateSale[]>([]);
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"sales" | "products">("sales");
  const { toast } = useToast();

  // Dynamic affiliate ID from URL or localStorage
  const affiliateId = getAffiliateId();

  useEffect(() => {
    if (affiliateId && affiliateId !== "default_user") {
      loadAffiliateData();
    }
  }, [affiliateId]);

  const loadAffiliateData = () => {
    loadAffiliateSales();
    loadAffiliateProducts();
  };

  const loadAffiliateSales = () => {
    try {
      const salesRef = ref(database, 'orders');
      const affiliateSalesQuery = query(salesRef, orderByChild('affiliateId'), equalTo(affiliateId));
      
      const unsubscribe = onValue(affiliateSalesQuery, (snapshot) => {
        if (snapshot.exists()) {
          const salesData = snapshot.val();
          const salesArray: AffiliateSale[] = [];
          
          // Convert object to array and filter by affiliateId
          Object.entries(salesData).forEach(([key, value]: [string, any]) => {
            // Double check affiliateId match
            if (value.affiliateId === affiliateId) {
              salesArray.push({
                id: value.id || key,
                productId: value.productId,
                affiliateId: value.affiliateId,
                customerId: value.customerId || "N/A",
                productName: value.productName,
                price: value.price || 0,
                originalPrice: value.originalPrice,
                quantity: value.quantity || 1,
                totalAmount: value.totalAmount || 0,
                customerInfo: value.customerInfo || {
                  name: "N/A",
                  email: "N/A",
                  phone: "N/A",
                  address: "N/A",
                  city: "N/A",
                  state: "N/A",
                  pincode: "N/A"
                },
                status: value.status || 'pending',
                createdAt: value.createdAt,
                images: value.images || [],
                category: value.category || "Unknown",
                discount: value.discount,
                commission: calculateCommission(value.price || 0, value.quantity || 1)
              });
            }
          });
          
          // Sort by creation date, newest first
          salesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setSales(salesArray);
        } else {
          setSales([]);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading affiliate sales:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliate sales data",
        variant: "destructive",
      });
    }
  };

  const loadAffiliateProducts = () => {
    try {
      const affiliateRef = ref(database, `affiliates/${affiliateId}/products`);
      
      const unsubscribe = onValue(affiliateRef, (snapshot) => {
        if (snapshot.exists()) {
          const productsData = snapshot.val();
          const productsArray: AffiliateProduct[] = [];
          
          // Convert object to array
          Object.entries(productsData).forEach(([productId, value]: [string, any]) => {
            productsArray.push({
              productId: productId,
              affiliateId: value.affiliateId,
              customerId: value.customerId || "N/A",
              productName: value.productName || "Unknown Product",
              price: value.price || 0,
              commission: value.commission || 100,
              clicks: value.clicks || 0,
              sales: value.sales || 0,
              createdAt: value.createdAt,
              lastAccessed: value.lastAccessed
            });
          });
          
          // Sort by last accessed date, newest first
          productsArray.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
          setAffiliateProducts(productsArray);
        } else {
          setAffiliateProducts([]);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading affiliate products:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliate products data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const calculateCommission = (price: number, quantity: number): number => {
    const baseCommission = 100; // ₹100 per sale
    return baseCommission * quantity;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      shipped: { variant: "default", label: "Shipped" },
      delivered: { variant: "success", label: "Delivered" },
      cancelled: { variant: "destructive", label: "Cancelled" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getTotalStats = () => {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalCommission = sales.reduce((sum, sale) => sum + sale.commission, 0);
    const pendingOrders = sales.filter(sale => sale.status === 'pending').length;
    const deliveredOrders = sales.filter(sale => sale.status === 'delivered').length;

    // Product stats
    const totalProducts = affiliateProducts.length;
    const totalClicks = affiliateProducts.reduce((sum, product) => sum + product.clicks, 0);
    const totalProductSales = affiliateProducts.reduce((sum, product) => sum + product.sales, 0);
    const totalProductCommission = affiliateProducts.reduce((sum, product) => sum + (product.commission * product.sales), 0);

    return { 
      totalSales, 
      totalRevenue, 
      totalCommission, 
      pendingOrders, 
      deliveredOrders,
      totalProducts,
      totalClicks,
      totalProductSales,
      totalProductCommission
    };
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerInfo.phone.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || sale.status === statusFilter;
    
    const matchesDate = dateFilter === "all" || isInDateRange(sale.createdAt, dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredProducts = affiliateProducts.filter(product => 
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isInDateRange = (dateString: string, range: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    
    switch (range) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      default:
        return true;
    }
  };

  const exportToCSV = () => {
    const headers = activeTab === "sales" ? [
      'Order ID',
      'Product Name',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Quantity',
      'Total Amount',
      'Commission',
      'Status',
      'Order Date'
    ] : [
      'Product ID',
      'Product Name',
      'Price',
      'Commission',
      'Clicks',
      'Sales',
      'Total Commission',
      'Created Date',
      'Last Accessed'
    ];

    const csvData = activeTab === "sales" 
      ? filteredSales.map(sale => [
          sale.id,
          sale.productName,
          sale.customerInfo.name,
          sale.customerInfo.email,
          sale.customerInfo.phone,
          sale.quantity,
          sale.totalAmount,
          sale.commission,
          sale.status,
          new Date(sale.createdAt).toLocaleDateString()
        ])
      : filteredProducts.map(product => [
          product.productId,
          product.productName,
          product.price,
          product.commission,
          product.clicks,
          product.sales,
          (product.commission * product.sales),
          new Date(product.createdAt).toLocaleDateString(),
          new Date(product.lastAccessed).toLocaleDateString()
        ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-${activeTab}-${affiliateId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Your ${activeTab} data exported to CSV`,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Affiliate ID copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your affiliate data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Affiliate Dashboard</h1>
          <p className="text-muted-foreground">
            Track your sales and products performance
          </p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export {activeTab === "sales" ? "Sales" : "Products"} CSV
        </Button>
      </div>

      {/* User Info Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Your Affiliate Dashboard</h3>
              <p className="text-green-600 text-sm">
                This dashboard shows data for your unique affiliate ID
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-green-600 mb-1">Your Affiliate ID:</div>
            <div className="flex items-center">
              <code className="bg-white px-3 py-1 rounded text-green-800 font-mono text-sm border border-green-200">
                {affiliateId}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => copyToClipboard(affiliateId)}
                title="Copy your affiliate ID"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "sales"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("sales")}
          >
            Sales & Orders
          </button>
          <button
            className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "products"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Products Performance
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {activeTab === "sales" ? "Your Total Sales" : "Your Products"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTab === "sales" ? stats.totalSales : stats.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTab === "sales" ? "Your total orders" : "Products you promoted"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {activeTab === "sales" ? "Your Revenue" : "Total Clicks"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTab === "sales" 
                ? `₹${stats.totalRevenue.toLocaleString()}`
                : stats.totalClicks.toLocaleString()
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTab === "sales" ? "Generated through your links" : "Total link clicks"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {activeTab === "sales" ? "Your Commission" : "Product Sales"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTab === "sales" 
                ? `₹${stats.totalCommission.toLocaleString()}`
                : stats.totalProductSales
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTab === "sales" ? "Your personal earnings" : "Sales from your products"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {activeTab === "sales" ? "Pending Orders" : "Product Commission"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTab === "sales" 
                ? stats.pendingOrders 
                : `₹${stats.totalProductCommission.toLocaleString()}`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTab === "sales" ? "Your pending orders" : "Commission from products"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {activeTab === "sales" ? "Delivered" : "Active Products"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTab === "sales" ? stats.deliveredOrders : affiliateProducts.filter(p => p.sales > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTab === "sales" ? "Your delivered orders" : "Products with sales"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter your {activeTab} data by different criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search by ${activeTab === "sales" ? "product, customer..." : "product name..."}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {activeTab === "sales" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {activeTab === "sales" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-background"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      {activeTab === "sales" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Sales Details</CardTitle>
            <CardDescription>
              Detailed view of all products purchased through your affiliate links
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sales Found</h3>
                <p className="text-muted-foreground">
                  {sales.length === 0 
                    ? "No products have been purchased through your affiliate links yet." 
                    : "No sales match your current filters."}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Your Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">
                          {sale.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {sale.images.length > 0 && (
                              <img
                                src={sale.images[0]}
                                alt={sale.productName}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">{sale.productName}</div>
                              <div className="text-sm text-muted-foreground">{sale.category}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sale.customerInfo.name}</div>
                            <div className="text-sm text-muted-foreground">{sale.customerInfo.email}</div>
                            <div className="text-sm text-muted-foreground">{sale.customerInfo.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {sale.customerId.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell>
                          <div className="font-medium">₹{sale.totalAmount.toLocaleString()}</div>
                          {sale.originalPrice && sale.originalPrice > sale.price && (
                            <div className="text-sm text-muted-foreground line-through">
                              ₹{sale.originalPrice.toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            ₹{sale.commission.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell>
                          {new Date(sale.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Your Order Details",
                                description: (
                                  <div className="space-y-2">
                                    <p><strong>Product:</strong> {sale.productName}</p>
                                    <p><strong>Customer:</strong> {sale.customerInfo.name}</p>
                                    <p><strong>Customer ID:</strong> {sale.customerId}</p>
                                    <p><strong>Address:</strong> {sale.customerInfo.address}, {sale.customerInfo.city}</p>
                                    <p><strong>Total Amount:</strong> ₹{sale.totalAmount}</p>
                                    <p><strong>Your Commission:</strong> ₹{sale.commission}</p>
                                    <p><strong>Your Affiliate ID:</strong> {sale.affiliateId}</p>
                                  </div>
                                ),
                              });
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            {filteredSales.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Showing:</span>
                    <span className="font-medium ml-2">{filteredSales.length} of {sales.length} orders</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Your Filtered Revenue:</span>
                    <span className="font-medium ml-2">
                      ₹{filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Your Filtered Commission:</span>
                    <span className="font-medium text-green-600 ml-2">
                      ₹{filteredSales.reduce((sum, sale) => sum + sale.commission, 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Your Affiliate ID:</span>
                    <span className="font-medium ml-2">{affiliateId}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      {activeTab === "products" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Products Performance</CardTitle>
            <CardDescription>
              Track performance of products you've promoted with your affiliate links
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
                <p className="text-muted-foreground">
                  {affiliateProducts.length === 0 
                    ? "You haven't promoted any products yet with your affiliate links." 
                    : "No products match your current search."}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Total Commission</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Last Accessed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const conversionRate = product.clicks > 0 
                        ? ((product.sales / product.clicks) * 100).toFixed(2)
                        : "0.00";
                      const totalCommission = product.commission * product.sales;

                      return (
                        <TableRow key={product.productId}>
                          <TableCell className="font-mono text-xs">
                            {product.productId.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell>₹{product.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              ₹{product.commission}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.clicks}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.sales}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              ₹{totalCommission.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${
                              parseFloat(conversionRate) > 5 ? 'text-green-600' : 
                              parseFloat(conversionRate) > 2 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {conversionRate}%
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(product.lastAccessed).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Products Summary */}
            {filteredProducts.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Showing:</span>
                    <span className="font-medium ml-2">{filteredProducts.length} of {affiliateProducts.length} products</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Clicks:</span>
                    <span className="font-medium ml-2">
                      {filteredProducts.reduce((sum, product) => sum + product.clicks, 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Sales:</span>
                    <span className="font-medium ml-2">
                      {filteredProducts.reduce((sum, product) => sum + product.sales, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Commission:</span>
                    <span className="font-medium text-green-600 ml-2">
                      ₹{filteredProducts.reduce((sum, product) => sum + (product.commission * product.sales), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>How Your Affiliate System Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Your Unique Tracking</h4>
              <p className="text-sm text-muted-foreground">
                Your affiliate ID <code className="bg-muted px-1 rounded">{affiliateId}</code> is automatically 
                tracked across all your promotions and sales.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Real-time Performance</h4>
              <p className="text-sm text-muted-foreground">
                Track clicks, sales, and commissions for each product you promote. 
                See which products perform best with your audience.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Smart Commission System</h4>
              <p className="text-sm text-muted-foreground">
                Earn ₹100 commission for every product sold. Track your earnings 
                and get paid monthly for all delivered orders.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}