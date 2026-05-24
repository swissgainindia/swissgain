import { useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, User, QrCode, Share2 } from "lucide-react";

// Function to generate unique fingerprint for each user
const generateUserFingerprint = () => {
  if (typeof window === 'undefined') return "default_user";
  
  // Collect browser and device information to create a unique fingerprint
  const navigatorInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(','),
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  
  // Create a hash from the navigator info
  const navigatorString = JSON.stringify(navigatorInfo);
  let hash = 0;
  for (let i = 0; i < navigatorString.length; i++) {
    const char = navigatorString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Add timestamp for extra uniqueness (generated only once)
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 6);
  
  return `cust_${Math.abs(hash).toString(36)}_${timestamp}_${randomStr}`;
};

// Function to get or create unique customer ID
const getUniqueCustomerId = () => {
  if (typeof window === 'undefined') return "default_customer";
  
  // Check URL parameters first for affiliate tracking
  const urlParams = new URLSearchParams(window.location.search);
  const incomingAffiliateId = urlParams.get('affiliate');
  
  // Store referrer if coming from affiliate link
  if (incomingAffiliateId) {
    sessionStorage.setItem('affiliateReferrer', incomingAffiliateId);
  }
  
  // Try to get existing customer ID
  let customerId = localStorage.getItem('uniqueCustomerId');
  
  if (!customerId) {
    // Generate new unique customer ID based on browser fingerprint
    customerId = generateUserFingerprint();
    
    // Store in both storage for persistence
    localStorage.setItem('uniqueCustomerId', customerId);
    sessionStorage.setItem('uniqueCustomerId', customerId);
    
    console.log('New Customer ID Generated:', customerId);
  }
  
  return customerId;
};

// Function to generate product-specific affiliate codes (stable, no timestamp)
const generateProductAffiliateCode = (productId: string, customerId: string) => {
  // Create a unique code for this specific product and customer (stable)
  const productHash = productId.substring(productId.length - 6);
  const customerHash = customerId.substring(customerId.length - 6);
  
  return `prod_${productHash}_${customerHash}`;
};

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Unique customer ID for each user
  const [customerId, setCustomerId] = useState<string>("");
  const [productLinks, setProductLinks] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Set unique customer ID after component mounts
    const id = getUniqueCustomerId();
    setCustomerId(id);
    console.log("Unique Customer ID:", id);
  }, []);

  useEffect(() => {
    if (customerId) {
      loadProducts();
    }
  }, [customerId]);

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
    if (!customerId) return "#";
    
    // Generate unique affiliate code for this specific product (stable)
    const affiliateCode = generateProductAffiliateCode(productId, customerId);
    
    return `${window.location.origin}/product/${productId}?affiliate=${customerId}&code=${affiliateCode}&source=affiliate_link`;
  };

  const generateShareableLink = (productId: string) => {
    if (!customerId) return "#";
    
    const affiliateCode = generateProductAffiliateCode(productId, customerId);
    const product = products.find(p => p._id === productId);
    
    if (product) {
      return `${window.location.origin}/product/${productId}?affiliate=${customerId}&code=${affiliateCode}&ref=share`;
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
    return generateProductAffiliateCode(productId, customerId);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading products and generating your unique links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Affiliate Products</h2>
        <div className="flex gap-4">
          <Button className="bg-green-600 hover:bg-green-700">
            <a href="./affiliatesales" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              My Sales Dashboard
            </a>
          </Button>
        </div>
      </div>

      {/* Unique Customer Info Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800">Your Unique Affiliate System</h3>
              <p className="text-purple-600 text-sm">
                Each product has a unique link. Share and track them separately!
              </p>
              <div className="flex items-center mt-1 text-xs text-purple-500">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Unique Customer ID • {products.length} Products Loaded
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-purple-600 mb-1">Your Unique ID:</div>
            <div className="flex items-center">
              <code className="bg-white px-3 py-1 rounded text-purple-800 font-mono text-sm border border-purple-200 max-w-[150px] truncate">
                {customerId}
              </code>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => copyToClipboard(customerId, "Customer ID copied")}
                title="Copy your unique ID"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table with Unique Links */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Your Commission</TableHead>
              <TableHead>Unique Affiliate Code</TableHead>
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
                      <span className="text-xs text-muted-foreground">per sale</span>
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
                          onClick={() => copyToClipboard(affiliateLink, "Product affiliate link copied")}
                          title="Copy affiliate link"
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
                            title="Open product page"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => shareProduct(product._id)}
                          title="Share product"
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
                            title="Generate QR Code"
                          >
                            <QrCode className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                      <div 
                        className="text-xs text-muted-foreground max-w-[180px] truncate cursor-help" 
                        title={`Click to copy: ${affiliateLink}`}
                        onClick={() => copyToClipboard(affiliateLink, "Product link copied")}
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

      {/* How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold mb-2 text-blue-800">🔐 Unique Tracking System</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Unique Customer ID</strong> - Automatically generated for you</li>
            <li>• <strong>Product-Specific Links</strong> - Each product has different affiliate code</li>
            <li>• <strong>Advanced Tracking</strong> - Track which products perform best</li>
            <li>• <strong>Browser Fingerprint</strong> - Unique ID based on your device</li>
            <li>• <strong>No Manual Setup</strong> - Everything works automatically</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold mb-2 text-green-800">💰 Smart Commission System</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>₹100 Commission</strong> on every product sale</li>
            <li>• <strong>Product-Level Tracking</strong> - See which products earn most</li>
            <li>• <strong>Multiple Share Options</strong> - Copy, Share, QR Code</li>
            <li>• <strong>Real-time Analytics</strong> in Sales Dashboard</li>
            <li>• <strong>Cross-Device Support</strong> - Your ID works on all your devices</li>
          </ul>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{products.length}</div>
          <div className="text-sm text-muted-foreground">Unique Products</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {products.filter(p => p.inStock).length}
          </div>
          <div className="text-sm text-muted-foreground">Ready to Promote</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">₹100</div>
          <div className="text-sm text-muted-foreground">Per Sale Commission</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {products.reduce((sum, p) => sum + (p.sales || 0), 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Sales</div>
        </div>
      </div>

      {/* System Features */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-gray-800">🎯 Advanced Affiliate Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-gray-700">Unique ID Generation</div>
            <div className="text-gray-600">Automatically creates unique ID for each customer using browser fingerprinting</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-gray-700">Product-Level Tracking</div>
            <div className="text-gray-600">Each product gets unique affiliate code for precise performance tracking</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-gray-700">Multi-Platform Sharing</div>
            <div className="text-gray-600">Share via direct links, social media, QR codes, and more</div>
          </div>
        </div>
      </div>
    </div>
  );
}