import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Eye, Search, Filter, Download, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // ADD THIS IMPORT

// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';

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

interface Order {
  id: string;
  productId: string;
  affiliateId?: string;
  customerId?: string;
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
  commission?: number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const firebaseDatabase = initializeFirebase();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    try {
      const ordersRef = ref(firebaseDatabase, 'orders');
      
      const unsubscribe = onValue(ordersRef, (snapshot) => {
        if (snapshot.exists()) {
          const ordersData = snapshot.val();
          const ordersArray: Order[] = [];
          
          // Default customer info
          const defaultCustomerInfo = {
            name: "N/A",
            email: "N/A",
            phone: "N/A",
            address: "N/A",
            city: "N/A",
            state: "N/A",
            pincode: "N/A"
          };
          
          // Convert Firebase object to array
          Object.entries(ordersData).forEach(([key, value]: [string, any]) => {
            ordersArray.push({
              id: value.id || key,
              productId: value.productId || '',
              affiliateId: value.affiliateId,
              customerId: value.customerId,
              productName: value.productName || 'Unknown',
              price: value.price || 0,
              originalPrice: value.originalPrice,
              quantity: value.quantity || 1,
              totalAmount: value.totalAmount || 0,
              customerInfo: {
                ...defaultCustomerInfo,
                ... (value.customerInfo || {})
              },
              status: value.status || 'pending',
              createdAt: value.createdAt || new Date().toISOString(),
              images: value.images || [],
              category: value.category || "Unknown",
              discount: value.discount,
              commission: value.commission || 0
            });
          });
          
          // Sort by creation date, newest first
          ordersArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(ordersArray);
        } else {
          setOrders([]);
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders from Firebase",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = ref(firebaseDatabase, `orders/${orderId}`);
      await update(orderRef, { status: newStatus });
      
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const orderRef = ref(firebaseDatabase, `orders/${orderId}`);
      await remove(orderRef);
      
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      
      // Update local state
      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "confirmed": return "default";
      case "shipped": return "outline";
      case "delivered": return "default";
      case "cancelled": return "destructive";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "confirmed": return "text-blue-600 bg-blue-100";
      case "shipped": return "text-orange-600 bg-orange-100";
      case "delivered": return "text-green-600 bg-green-100";
      case "cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerInfo.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerInfo.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(order => order.status === 'pending').length,
    confirmed: orders.filter(order => order.status === 'confirmed').length,
    shipped: orders.filter(order => order.status === 'shipped').length,
    delivered: orders.filter(order => order.status === 'delivered').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    affiliateOrders: orders.filter(order => order.affiliateId).length,
  };

  const exportToCSV = () => {
    const headers = [
      'Order ID',
      'Product Name',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Quantity',
      'Price',
      'Total Amount',
      'Status',
      'Order Date',
      'Affiliate ID',
      'Customer ID',
      'Address',
      'City',
      'State',
      'Pincode'
    ].join(',');

    const csvData = filteredOrders.map(order => [
      order.id,
      `"${order.productName}"`,
      `"${order.customerInfo.name}"`,
      order.customerInfo.email,
      order.customerInfo.phone,
      order.quantity,
      order.price,
      order.totalAmount,
      order.status,
      format(new Date(order.createdAt), "yyyy-MM-dd HH:mm:ss"),
      order.affiliateId || 'N/A',
      order.customerId || 'N/A',
      `"${order.customerInfo.address}"`,
      order.customerInfo.city,
      order.customerInfo.state,
      order.customerInfo.pincode
    ].join(','));

    const csv = [headers, ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading orders from Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">All Product Orders</h2>
          <p className="text-muted-foreground">
            Manage and track all customer orders from Firebase
          </p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
            <div className="text-sm text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.shipped}</div>
            <div className="text-sm text-muted-foreground">Shipped</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            <div className="text-sm text-muted-foreground">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-muted-foreground">Cancelled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by product, customer, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Orders ({filteredOrders.length})
            {stats.affiliateOrders > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                • {stats.affiliateOrders} affiliate orders
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {order.images && order.images.length > 0 && (
                            <img
                              src={order.images[0]}
                              alt={order.productName}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium">{order.productName}</div>
                            <div className="text-sm text-muted-foreground">
                              ₹{order.price.toLocaleString()} × {order.quantity}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerInfo.name}</div>
                          <div className="text-sm text-muted-foreground">{order.customerInfo.email}</div>
                          <div className="text-xs text-muted-foreground">{order.customerInfo.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell className="font-semibold">
                        ₹{order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)} className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.affiliateId ? (
                          <Badge variant="outline" className="text-xs">
                            {order.affiliateId.substring(0, 8)}...
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Direct</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Order ID</label>
                      <p className="text-sm font-mono">{selectedOrder.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Order Date</label>
                      <p className="text-sm">{format(new Date(selectedOrder.createdAt), "PPP 'at' HH:mm")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Customer ID</label>
                      <p className="text-sm font-mono">{selectedOrder.customerId || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    {selectedOrder.images && selectedOrder.images.length > 0 && (
                      <img
                        src={selectedOrder.images[0]}
                        alt={selectedOrder.productName}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">{selectedOrder.productName}</h4>
                      <p className="text-sm text-muted-foreground">Category: {selectedOrder.category}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="font-semibold">₹{selectedOrder.price.toLocaleString()}</span>
                        <span>× {selectedOrder.quantity}</span>
                        <span className="font-bold">= ₹{selectedOrder.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm">{selectedOrder.customerInfo.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm">{selectedOrder.customerInfo.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <p className="text-sm">{selectedOrder.customerInfo.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Address</label>
                      <p className="text-sm">{selectedOrder.customerInfo.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">City</label>
                      <p className="text-sm">{selectedOrder.customerInfo.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">State</label>
                      <p className="text-sm">{selectedOrder.customerInfo.state}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">PIN Code</label>
                      <p className="text-sm">{selectedOrder.customerInfo.pincode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Affiliate Information */}
              {selectedOrder.affiliateId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Affiliate Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Affiliate ID</label>
                        <p className="text-sm font-mono">{selectedOrder.affiliateId}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Commission</label>
                        <p className="text-sm font-semibold text-green-600">
                          ₹{(selectedOrder.commission || 100).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}