import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Target, CreditCard, Plus, Eye, Copy, LinkIcon, Users, ExternalLink, QrCode, Share2 } from 'lucide-react';
import { fetchProducts } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  useAuth,
  findUserByCredentials,
  saveNewAffiliate,
} from '@/lib/auth';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, get, set } from 'firebase/database';

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
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    app = initializeApp(firebaseConfig, 'AffiliateEarningsApp');
    database = getDatabase(app);
  } else {
    console.error('Firebase initialization error:', error);
  }
}

interface AffiliateEarningsContentProps {
  data: {
    membership: {
      isAffiliate: boolean;
    };
  };
  affiliateEarnings: any[];
  affiliateLinks: any[];
  handleSimulateSale: () => void;
  onGenerateLink: () => void;
}

// Function to get affiliate ID from auth system
const getAffiliateId = (userData: any, uid: string): string => {
  // Use user ID from auth data if available, otherwise fallback to UID
  if (userData?.userId) {
    return userData.userId;
  }
  if (userData?.id) {
    return userData.id;
  }
  return uid;
};

// Function to generate product-specific affiliate codes (stable, no timestamp)
const generateProductAffiliateCode = (productId: string, affiliateId: string) => {
  // Create a unique code for this specific product and affiliate (stable)
  const productHash = productId.substring(productId.length - 6);
  const affiliateHash = affiliateId.substring(affiliateId.length - 6);
  
  return `prod_${productHash}_${affiliateHash}`;
};

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

export function AffiliateEarningsContent({
  data,
  affiliateEarnings,
  affiliateLinks,
  handleSimulateSale,
  onGenerateLink
}: AffiliateEarningsContentProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAffiliateSales, setUserAffiliateSales] = useState<AffiliateSale[]>([]);
  
  // Use auth hook to get user data and UID
  const { uid, isLoggedIn, userData, isAffiliate, affiliateData } = useAuth();
  
  // Affiliate ID for the logged-in user
  const [affiliateId, setAffiliateId] = useState<string>("");
  const [productLinks, setProductLinks] = useState<{[key: string]: string}>({});

  // Set affiliate ID from auth system when user data is available
  useEffect(() => {
    if (uid && userData) {
      const id = getAffiliateId(userData, uid);
      setAffiliateId(id);
      console.log("Your Affiliate ID:", id);
    }
  }, [uid, userData]);

  useEffect(() => {
    if (affiliateId && affiliateId !== "" && isLoggedIn) {
      loadProducts();
      loadUserAffiliateSales();
    }
  }, [affiliateId, isLoggedIn]);

  const loadUserAffiliateSales = () => {
    try {
      const salesRef = ref(database, 'orders');
      
      const unsubscribe = onValue(salesRef, (snapshot) => {
        if (snapshot.exists()) {
          const salesData = snapshot.val();
          const salesArray: AffiliateSale[] = [];
          
          // Convert object to array and filter by affiliateId
          Object.entries(salesData).forEach(([key, value]: [string, any]) => {
            // Only include sales with matching affiliateId
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
          setUserAffiliateSales(salesArray);
        } else {
          setUserAffiliateSales([]);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading your affiliate sales:', error);
    }
  };

  const calculateCommission = (price: number, quantity: number): number => {
    const baseCommission = 100; // ₹100 per sale
    return baseCommission * quantity;
  };

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
      
      // Generate unique links for each product (stable)
      const links: {[key: string]: string} = {};
      data.forEach((product: any) => {
        links[product._id] = generateAffiliateLink(product._id);
      });
      setProductLinks(links);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateLink = (productId: string) => {
    if (!affiliateId) return "#";
    
    // Generate unique affiliate code for this specific product (stable)
    const affiliateCode = generateProductAffiliateCode(productId, affiliateId);
    
    return `${window.location.origin}/product/${productId}?affiliate=${affiliateId}&code=${affiliateCode}&source=affiliate_link`;
  };

  const generateShareableLink = (productId: string) => {
    if (!affiliateId) return "#";
    
    const affiliateCode = generateProductAffiliateCode(productId, affiliateId);
    const product = products.find(p => p._id === productId);
    
    if (product) {
      return `${window.location.origin}/product/${productId}?affiliate=${affiliateId}&code=${affiliateCode}&ref=share`;
    }
    
    return "#";
  };

  const copyToClipboard = async (text: string, message: string = "Link copied to clipboard") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareProduct = async (productId: string) => {
    const shareLink = generateShareableLink(productId);
    const product = products.find(p => p._id === productId);
    
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: `Buy ${product.name} - Get Great Discount!`,
          text: `Check out this amazing product: ${product.name}`,
          url: shareLink,
        });
      } catch (error) {
        // Fallback to copy if share fails
        copyToClipboard(shareLink, "Product link copied for sharing");
      }
    } else {
      copyToClipboard(shareLink, "Product link copied for sharing");
    }
  };

  const generateQRCodeLink = (productId: string) => {
    const affiliateLink = generateAffiliateLink(productId);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(affiliateLink)}`;
  };

  const getProductAffiliateCode = (productId: string) => {
    return generateProductAffiliateCode(productId, affiliateId);
  };

  // Calculate your real earnings from your sales
  const getYourEarningsStats = () => {
    const yourTotalSales = userAffiliateSales.length;
    const yourTotalRevenue = userAffiliateSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const yourTotalCommission = userAffiliateSales.reduce((sum, sale) => sum + sale.commission, 0);
    const yourDeliveredOrders = userAffiliateSales.filter(sale => sale.status === 'delivered').length;
    const yourPendingOrders = userAffiliateSales.filter(sale => sale.status === 'pending').length;

    return {
      yourTotalSales,
      yourTotalRevenue,
      yourTotalCommission,
      yourDeliveredOrders,
      yourPendingOrders
    };
  };

  const yourEarningsStats = getYourEarningsStats();
  const totalEarnings = affiliateEarnings?.reduce((sum: number, earning: any) => sum + (earning.amount || 0), 0) || 0;
  const totalSales = affiliateEarnings?.length || 0;

  // Use your real sales data or fallback to affiliateEarnings
  const displayTotalSales = yourEarningsStats.yourTotalSales || totalSales;
  const displayTotalEarnings = yourEarningsStats.yourTotalCommission || totalEarnings;

  // Show loading state while initializing
  if (loading || !affiliateId) {
    return (
      <div className="space-y-6">
        <div className="p-6 flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your affiliate system...</p>
            {!isLoggedIn && (
              <p className="text-sm text-muted-foreground mt-2">
                Please log in to access your affiliate dashboard
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Your Unique Affiliate Info Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800">Your Personal Affiliate System</h3>
                <p className="text-purple-600 text-sm">
                  Each product has your unique link. Share and track them separately!
                </p>
                <div className="flex items-center mt-1 text-xs text-purple-500">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Your Unique Affiliate ID • {products.length} Products Loaded • {yourEarningsStats.yourTotalSales} Your Sales
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-purple-600 mb-1">Your Affiliate ID:</div>
              <div className="flex items-center">
                <code className="bg-white px-3 py-1 rounded text-purple-800 font-mono text-sm border border-purple-200 max-w-[150px] truncate">
                  {affiliateId}
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => copyToClipboard(affiliateId, "Your Affiliate ID copied")}
                  title="Copy your affiliate ID"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Products Table with Unique Links */}
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Products</CardTitle>
          <CardDescription>
            Promote these products and earn ₹100 commission on every sale through your links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Your Commission</TableHead>
                  <TableHead>Your Unique Affiliate Code</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const affiliateLink = productLinks[product._id] || generateAffiliateLink(product._id);
                  const productCode = getProductAffiliateCode(product._id);
                  const commission = 100; // ₹100 per sale
                  
                  return (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">ID: {product._id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          {product.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">₹{product.price}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.inStock 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-600">₹{commission}</span>
                          <span className="text-xs text-muted-foreground">per your sale</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono">
                          {productCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(affiliateLink, "Your product affiliate link copied")}
                              title="Copy your affiliate link"
                              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            >
                              <a 
                                href={affiliateLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title="Open product page with your link"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shareProduct(product._id)}
                              title="Share your product"
                              className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                            >
                              <Share2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                            >
                              <a 
                                href={generateQRCodeLink(product._id)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title="Generate your QR Code"
                              >
                                <QrCode className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                          <div 
                            className="text-xs text-muted-foreground max-w-[180px] truncate cursor-help" 
                            title={`Click to copy your link: ${affiliateLink}`}
                            onClick={() => copyToClipboard(affiliateLink, "Your product link copied")}
                          >
                            {affiliateLink.substring(0, 30)}...
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Your Sales Performance Summary */}
      {yourEarningsStats.yourTotalSales > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Sales Performance</CardTitle>
            <CardDescription>
              Summary of your personal affiliate sales through your links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{yourEarningsStats.yourTotalSales}</div>
                <div className="text-xs text-muted-foreground">Your Total Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{yourEarningsStats.yourDeliveredOrders}</div>
                <div className="text-xs text-muted-foreground">Your Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{yourEarningsStats.yourPendingOrders}</div>
                <div className="text-xs text-muted-foreground">Your Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">₹{yourEarningsStats.yourTotalRevenue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Your Total Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{yourEarningsStats.yourTotalCommission.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Your Commission</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How Your System Works */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 text-lg">🔐 Your Unique Tracking System</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• <strong>Your Unique Affiliate ID</strong> - Based on your account information</li>
              <li>• <strong>Your Product-Specific Links</strong> - Each product has your different affiliate code</li>
              <li>• <strong>Your Advanced Tracking</strong> - Track which products perform best for you</li>
              <li>• <strong>Permanent ID</strong> - Your affiliate ID never changes</li>
              <li>• <strong>No Manual Setup</strong> - Everything works automatically for you</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 text-lg">💰 Your Smart Commission System</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-green-700 space-y-2">
              <li>• <strong>₹100 Your Commission</strong> on every product sale through your links</li>
              <li>• <strong>Your Product-Level Tracking</strong> - See which products earn most for you</li>
              <li>• <strong>Your Multiple Share Options</strong> - Copy, Share, QR Code with your links</li>
              <li>• <strong>Your Real-time Analytics</strong> in Sales Dashboard</li>
              <li>• <strong>Your Permanent Affiliate ID</strong> - Same ID every time you login</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Your Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{products.length}</div>
            <div className="text-sm text-muted-foreground">Your Unique Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.inStock).length}
            </div>
            <div className="text-sm text-muted-foreground">Ready for You to Promote</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">₹100</div>
            <div className="text-sm text-muted-foreground">Your Per Sale Commission</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {yourEarningsStats.yourTotalSales}
            </div>
            <div className="text-sm text-muted-foreground">Your Total Sales</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action */}
      <Card>
        <CardHeader>
          <CardTitle>Your Quick Test</CardTitle>
          <CardDescription>
            Simulate a sale to see how your system works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSimulateSale} className="w-full md:w-auto">
            <DollarSign className="h-4 w-4 mr-2" />
            Simulate Your Sale (₹100)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AffiliateEarningsContent;