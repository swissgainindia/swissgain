import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, Search, Filter, Download, User, Mail, Phone, DollarSign, ShoppingBag, TrendingUp, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, update, query, orderByChild } from 'firebase/database';
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
interface AffiliateUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  rank: number;
  status: 'active' | 'inactive' | 'suspended';
  membership: {
    type: string;
    rank: number;
    status: string;
  };
  stats?: {
    totalSales: number;
    totalCommission: number;
    teamMembers: number;
    teamSales: number;
  };
  isAffiliate: boolean;
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
export default function AdminUsers() {
  const [users, setUsers] = useState<AffiliateUser[]>([]);
  const [allSales, setAllSales] = useState<AffiliateSale[]>([]);
  const [allProducts, setAllProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rankFilter, setRankFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AffiliateUser | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "sales" | "products">("users");
  const { toast } = useToast();
  const firebaseDatabase = initializeFirebase();
  useEffect(() => {
    loadUsers();
    loadAllSales();
    loadAllProducts();
  }, []);
  const loadUsers = () => {
    try {
      // Load from affiliates (primary source for user data)
      const affiliatesRef = ref(firebaseDatabase, 'affiliates');
    
      const unsubscribe = onValue(affiliatesRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const usersArray: AffiliateUser[] = [];
        
          // Convert Firebase object to array
          Object.entries(usersData).forEach(([key, value]: [string, any]) => {
            usersArray.push({
              id: key,
              userId: key, // Key is the userId in affiliates
              name: value.name || 'Unknown',
              email: value.email || 'No email',
              phone: value.phone || 'No phone',
              joinedAt: value.joinedAt || new Date().toISOString(),
              rank: value.rank || 1,
              status: value.status || 'active',
              membership: value.membership || {
                type: 'affiliate',
                rank: value.rank || 1,
                status: value.status || 'active'
              },
              stats: value.stats || {
                totalSales: 0,
                totalCommission: 0,
                teamMembers: 0,
                teamSales: 0
              },
              isAffiliate: true
            });
          });
        
          // Sort by join date, newest first
          usersArray.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
          setUsers(usersArray);
        } else {
          setUsers([]);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users from Firebase",
        variant: "destructive",
      });
    }
  };
  const loadAllSales = () => {
    try {
      const salesRef = ref(firebaseDatabase, 'orders');
    
      const unsubscribe = onValue(salesRef, (snapshot) => {
        if (snapshot.exists()) {
          const salesData = snapshot.val();
          const salesArray: AffiliateSale[] = [];
        
          // Convert object to array
          Object.entries(salesData).forEach(([key, value]: [string, any]) => {
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
          });
        
          // Sort by creation date, newest first
          salesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAllSales(salesArray);
        } else {
          setAllSales([]);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      });
    }
  };
  const loadAllProducts = () => {
    try {
      const affiliatesRef = ref(firebaseDatabase, 'affiliates');
    
      const unsubscribe = onValue(affiliatesRef, (snapshot) => {
        if (snapshot.exists()) {
          const affiliatesData = snapshot.val();
          const productsArray: AffiliateProduct[] = [];
        
          // Convert object to array and extract products
          Object.entries(affiliatesData).forEach(([affiliateId, affiliateData]: [string, any]) => {
            if (affiliateData.products) {
              Object.entries(affiliateData.products).forEach(([productId, productData]: [string, any]) => {
                productsArray.push({
                  productId: productId,
                  affiliateId: affiliateId,
                  customerId: productData.customerId || "N/A",
                  productName: productData.productName || "Unknown Product",
                  price: productData.price || 0,
                  commission: productData.commission || 100,
                  clicks: productData.clicks || 0,
                  sales: productData.sales || 0,
                  createdAt: productData.createdAt,
                  lastAccessed: productData.lastAccessed
                });
              });
            }
          });
        
          setAllProducts(productsArray);
          setLoading(false);
        } else {
          setAllProducts([]);
          setLoading(false);
        }
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  const calculateCommission = (price: number, quantity: number): number => {
    const baseCommission = 100; // ₹100 per sale
    return baseCommission * quantity;
  };
  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      // Update in affiliates (primary source)
      const userRef = ref(firebaseDatabase, `affiliates/${userId}`);
      await update(userRef, {
        status: newStatus,
        membership: {
          type: 'affiliate',
          rank: users.find(u => u.id === userId)?.rank || 1,
          status: newStatus
        }
      });
    
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    
      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === userId ? {
          ...user,
          status: newStatus as any,
          membership: {
            ...user.membership,
            status: newStatus
          }
        } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };
  const handleRankChange = async (userId: string, newRank: number) => {
    try {
      // Update in affiliates (primary source)
      const userRef = ref(firebaseDatabase, `affiliates/${userId}`);
      await update(userRef, {
        rank: newRank,
        membership: {
          type: 'affiliate',
          rank: newRank,
          status: users.find(u => u.id === userId)?.status || 'active'
        }
      });
    
      toast({
        title: "Success",
        description: `User rank updated to ${newRank}`,
      });
    
      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === userId ? {
          ...user,
          rank: newRank,
          membership: {
            ...user.membership,
            rank: newRank
          }
        } : user
      ));
    } catch (error) {
      console.error('Error updating user rank:', error);
      toast({
        title: "Error",
        description: "Failed to update user rank",
        variant: "destructive",
      });
    }
  };
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "suspended": return "destructive";
      default: return "default";
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-100";
      case "inactive": return "text-yellow-600 bg-yellow-100";
      case "suspended": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };
  const getSalesStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      shipped: { variant: "default", label: "Shipped" },
      delivered: { variant: "default", label: "Delivered" },
      cancelled: { variant: "destructive", label: "Cancelled" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };
  const getRankBadge = (rank: number) => {
    const rankNames = [
      "Starter", "Builder", "Leader", "Supervisor", "Mentor",
      "Ambassador", "Director", "Chairman", "Crown", "Legend"
    ];
    const rankColors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-red-100 text-red-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-teal-100 text-teal-800",
      "bg-cyan-100 text-cyan-800",
      "bg-amber-100 text-amber-800"
    ];
  
    const rankName = rankNames[rank - 1] || `Rank ${rank}`;
    const rankColor = rankColors[rank - 1] || "bg-gray-100 text-gray-800";
  
    return (
      <Badge variant="outline" className={rankColor}>
        {rankName}
      </Badge>
    );
  };
  // Get sales for a specific affiliate
  const getAffiliateSales = (affiliateId: string) => {
    return allSales.filter(sale => sale.affiliateId === affiliateId);
  };
  // Get products for a specific affiliate
  const getAffiliateProducts = (affiliateId: string) => {
    return allProducts.filter(product => product.affiliateId === affiliateId);
  };
  // Calculate user statistics with real sales data
  const getUserStats = (user: AffiliateUser) => {
    const userSales = getAffiliateSales(user.userId);
    const userProducts = getAffiliateProducts(user.userId);
  
    return {
      totalSales: userSales.length,
      totalRevenue: userSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalCommission: userSales.reduce((sum, sale) => sum + sale.commission, 0),
      totalProducts: userProducts.length,
      totalClicks: userProducts.reduce((sum, product) => sum + product.clicks, 0),
      deliveredOrders: userSales.filter(sale => sale.status === 'delivered').length,
      pendingOrders: userSales.filter(sale => sale.status === 'pending').length
    };
  };
  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.userId || '').toLowerCase().includes(searchTerm.toLowerCase());
  
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRank = rankFilter === "all" || user.rank.toString() === rankFilter;
  
    return matchesSearch && matchesStatus && matchesRank;
  });
  // Filter sales based on search
  const filteredSales = allSales.filter(sale => {
    const matchesSearch =
      (sale.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerInfo?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.affiliateId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerInfo?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
  
    return matchesSearch;
  });
  // Filter products based on search
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch =
      (product.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.affiliateId || '').toLowerCase().includes(searchTerm.toLowerCase());
  
    return matchesSearch;
  });
  // Calculate overall statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(user => user.status === 'active').length,
    totalSales: allSales.length,
    affiliateSales: allSales.filter(sale => sale.affiliateId).length,
    totalRevenue: allSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    totalCommission: allSales.reduce((sum, sale) => sum + sale.commission, 0),
    totalProducts: allProducts.length,
    newThisMonth: users.filter(user => {
      const joinDate = new Date(user.joinedAt);
      const now = new Date();
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
    }).length
  };
  const exportToCSV = () => {
    let headers: string[] = [];
    let csvData: string[][] = [];
    if (activeTab === "users") {
      headers = [
        'User ID',
        'Name',
        'Email',
        'Phone',
        'Join Date',
        'Rank',
        'Status',
        'Total Sales',
        'Total Revenue',
        'Total Commission',
        'Products Promoted'
      ];
      csvData = filteredUsers.map(user => {
        const userStats = getUserStats(user);
        return [
          user.userId,
          `"${user.name}"`,
          user.email,
          user.phone,
          format(new Date(user.joinedAt), "yyyy-MM-dd"),
          user.rank.toString(),
          user.status,
          userStats.totalSales.toString(),
          userStats.totalRevenue.toString(),
          userStats.totalCommission.toString(),
          userStats.totalProducts.toString()
        ];
      });
    } else if (activeTab === "sales") {
      headers = [
        'Order ID',
        'Product Name',
        'Affiliate ID',
        'Customer Name',
        'Customer Email',
        'Quantity',
        'Total Amount',
        'Commission',
        'Status',
        'Order Date'
      ];
      csvData = filteredSales.map(sale => [
        sale.id,
        `"${sale.productName}"`,
        sale.affiliateId || 'Direct',
        `"${sale.customerInfo.name}"`,
        sale.customerInfo.email,
        sale.quantity.toString(),
        sale.totalAmount.toString(),
        sale.commission.toString(),
        sale.status,
        format(new Date(sale.createdAt), "yyyy-MM-dd HH:mm:ss")
      ]);
    } else if (activeTab === "products") {
      headers = [
        'Product ID',
        'Product Name',
        'Affiliate ID',
        'Price',
        'Commission',
        'Clicks',
        'Sales',
        'Total Commission',
        'Created Date',
        'Last Accessed'
      ];
      csvData = filteredProducts.map(product => [
        product.productId,
        `"${product.productName}"`,
        product.affiliateId,
        product.price.toString(),
        product.commission.toString(),
        product.clicks.toString(),
        product.sales.toString(),
        (product.commission * product.sales).toString(),
        format(new Date(product.createdAt), "yyyy-MM-dd"),
        format(new Date(product.lastAccessed), "yyyy-MM-dd")
      ]);
    }
    const csv = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading affiliate data from Firebase...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Affiliate Management</h2>
          <p className="text-muted-foreground">
            Manage affiliates, track sales, and monitor product performance
          </p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export {activeTab} CSV
        </Button>
      </div>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Affiliate Users</TabsTrigger>
          <TabsTrigger value="sales">All Sales</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
        </TabsList>
        {/* Statistics Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Total Affiliates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <div className="text-sm text-muted-foreground">Active Affiliates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.affiliateSales}</div>
              <div className="text-sm text-muted-foreground">Affiliate Sales</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">₹{stats.totalCommission.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Commission</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Products Tracked</div>
            </CardContent>
          </Card>
        </div>
        {/* Filters */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    activeTab === "users" ? "Search users by name, email, phone, or user ID..." :
                    activeTab === "sales" ? "Search sales by product, customer, or affiliate ID..." :
                    "Search products by name or affiliate ID..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeTab === "users" && (
                <>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={rankFilter} onValueChange={setRankFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ranks</SelectItem>
                      <SelectItem value="1">Starter (1)</SelectItem>
                      <SelectItem value="2">Builder (2)</SelectItem>
                      <SelectItem value="3">Leader (3)</SelectItem>
                      <SelectItem value="4">Supervisor (4)</SelectItem>
                      <SelectItem value="5">Mentor (5)</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Users Tab Content */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Affiliate Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>User Info</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sales Performance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No affiliate users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => {
                        const userStats = getUserStats(user);
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono text-xs">
                              {(user.userId || '').substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {user.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(user.joinedAt), "MMM dd, yyyy")}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(user.joinedAt), "HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getRankBadge(user.rank)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(user.status)} className={getStatusColor(user.status)}>
                                {user.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between gap-2">
                                  <span className="text-muted-foreground">Sales:</span>
                                  <span className="font-medium">{userStats.totalSales}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <span className="text-muted-foreground">Revenue:</span>
                                  <span className="font-medium">₹{userStats.totalRevenue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <span className="text-muted-foreground">Commission:</span>
                                  <span className="font-medium text-green-600">
                                    ₹{userStats.totalCommission.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Select
                                  value={user.status}
                                  onValueChange={(value) => handleStatusChange(user.id, value)}
                                >
                                  <SelectTrigger className="w-[130px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={user.rank.toString()}
                                  onValueChange={(value) => handleRankChange(user.id, parseInt(value))}
                                >
                                  <SelectTrigger className="w-[130px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1,2,3,4,5].map(rank => (
                                      <SelectItem key={rank} value={rank.toString()}>
                                        Rank {rank}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Sales Tab Content */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                All Sales ({filteredSales.length})
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  • {allSales.filter(sale => sale.affiliateId).length} affiliate sales
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No sales found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono text-xs">
                            {(sale.id || '').substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {sale.images && sale.images.length > 0 && (
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
                            {sale.affiliateId ? (
                              <Badge variant="outline" className="text-xs">
                                {(sale.affiliateId || '').substring(0, 8)}...
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">Direct</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.customerInfo.name}</div>
                              <div className="text-sm text-muted-foreground">{sale.customerInfo.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell className="font-semibold">
                            ₹{sale.totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              ₹{sale.commission.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getSalesStatusBadge(sale.status)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sale.createdAt), "MMM dd, yyyy")}
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(sale.createdAt), "HH:mm")}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Products Tab Content */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Product Performance ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Affiliate ID</TableHead>
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
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const conversionRate = product.clicks > 0
                          ? ((product.sales / product.clicks) * 100).toFixed(2)
                          : "0.00";
                        const totalCommission = product.commission * product.sales;
                        return (
                          <TableRow key={`${product.productId}-${product.affiliateId}`}>
                            <TableCell className="font-mono text-xs">
                              {(product.productId || '').substring(0, 8)}...
                            </TableCell>
                            <TableCell className="font-medium">{product.productName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {(product.affiliateId || '').substring(0, 8)}...
                              </Badge>
                            </TableCell>
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
                              {format(new Date(product.lastAccessed), "MMM dd, yyyy")}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* User Detail Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details - {selectedUser.name}</DialogTitle>
            </DialogHeader>
          
            <div className="space-y-6">
              {/* User Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">User ID</label>
                      <p className="text-sm font-mono">{selectedUser.userId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Join Date</label>
                      <p className="text-sm">{format(new Date(selectedUser.joinedAt), "PPP 'at' HH:mm")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Badge variant={getStatusBadgeVariant(selectedUser.status)} className={getStatusColor(selectedUser.status)}>
                        {selectedUser.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rank</label>
                      {getRankBadge(selectedUser.rank)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Personal Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <p className="text-sm">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Membership Type</label>
                      <p className="text-sm capitalize">{selectedUser.membership.type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Performance Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const userStats = getUserStats(selectedUser);
                      return (
                        <>
                          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">{userStats.totalSales}</div>
                            <div className="text-sm text-blue-800">Total Sales</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-2xl font-bold text-green-600">
                              ₹{userStats.totalCommission.toLocaleString()}
                            </div>
                            <div className="text-sm text-green-800">Total Commission</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-2xl font-bold text-purple-600">{userStats.totalProducts}</div>
                            <div className="text-sm text-purple-800">Products Promoted</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-2xl font-bold text-orange-600">{userStats.totalClicks}</div>
                            <div className="text-sm text-orange-800">Total Clicks</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
              {/* User's Sales */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getAffiliateSales(selectedUser.userId)
                      .slice(0, 5)
                      .map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {sale.images && sale.images.length > 0 && (
                              <img
                                src={sale.images[0]}
                                alt={sale.productName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">{sale.productName}</div>
                              <div className="text-sm text-muted-foreground">
                                {sale.customerInfo.name} • {format(new Date(sale.createdAt), "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">₹{sale.totalAmount.toLocaleString()}</div>
                            <div className="text-sm text-green-600">Commission: ₹{sale.commission}</div>
                            {getSalesStatusBadge(sale.status)}
                          </div>
                        </div>
                      ))}
                    {getAffiliateSales(selectedUser.userId).length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No sales yet for this affiliate
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}