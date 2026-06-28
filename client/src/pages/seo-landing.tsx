import { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { addProductToCart } from '@/lib/storage';
import SEO from '@/components/layout/seo';
import { 
  ArrowLeft, 
  ShoppingCart, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Star, 
  MapPin, 
  Sparkles,
  HelpCircle,
  Gem,
  Award
} from 'lucide-react';

const FALLBACK_IMAGE = 'https://via.placeholder.com/600x600?text=No+Image+Available';

const getOptimizedImageUrl = (url: string, width: number = 600) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
  return url;
};

const formatCityName = (slug: string): string => {
  if (!slug) return '';
  
  const specialMap: Record<string, string> = {
    'navi-mumbai': 'Navi Mumbai',
    'pimpri-chinchwad': 'Pimpri-Chinchwad',
    'kalyan-dombivli': 'Kalyan-Dombivli',
    'vasai-virar': 'Vasai-Virar',
    'hubli-dharwad': 'Hubli-Dharwad',
    'mira-bhayandar': 'Mira-Bhayandar',
    'sangli': 'Sangli',
  };
  
  if (specialMap[slug.toLowerCase()]) {
    return specialMap[slug.toLowerCase()];
  }
  
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function SeoLanding() {
  const [, params] = useRoute('/buy/:productSlug-in-:citySlug');
  const routeParams = params as any;
  const [, setLocation] = useLocation();
  const { updateData } = useLocalStorage();
  const { toast } = useToast();

  // Robust Fallback parsing if wouter fails to separate multiple dashes correctly
  let productSlug = routeParams?.productSlug;
  let citySlug = routeParams?.citySlug;

  if (!productSlug || !citySlug) {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/buy/')) {
      const slugSegment = pathname.substring(5);
      const lastInIndex = slugSegment.lastIndexOf('-in-');
      if (lastInIndex !== -1) {
        productSlug = slugSegment.substring(0, lastInIndex);
        citySlug = slugSegment.substring(lastInIndex + 4);
      }
    }
  }

  const cityName = formatCityName(citySlug || '');

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!productSlug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/products/slug/${productSlug}`);
        if (res.data) {
          setProduct(res.data);
        } else {
          setError('Product not found');
        }
      } catch (err: any) {
        console.error('Error loading product for SEO landing:', err);
        setError(err.response?.data?.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productSlug]);

  const isInStock = product?.inStock && (product?.stockQuantity || 0) > 0;

  const handleAddToCart = () => {
    if (!product || !isInStock) return;
    updateData(addProductToCart.bind(null, { ...product, id: product._id }, quantity));
    toast({
      title: 'Added to Cart',
      description: `${product.name} added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    if (!product || !isInStock) return;
    updateData(addProductToCart.bind(null, { ...product, id: product._id }, quantity));
    setLocation('/cart');
  };

  if (loading) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mb-4"></div>
        <p className="text-muted-foreground text-lg">Finding premium collection details for you...</p>
      </div>
    );
  }

  if (error || !product || !citySlug) {
    return (
      <div className="py-24 bg-white min-h-[70vh] flex items-center justify-center text-center">
        <div className="max-w-md px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product or Location Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The jewelry item you are looking for in this location is currently unavailable. Please check our complete catalog.
          </p>
          <Link href="/products">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-3 rounded-lg shadow-md transition-all duration-300">
              <ArrowLeft className="mr-2 h-5 w-5" /> Browse All Jewelry
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const originalPrice = product.originalPrice || Math.round(product.price * 1.4);
  const discount = product.discount || Math.round(((originalPrice - product.price) / originalPrice) * 100);

  // SEO Text Constants
  const pageTitle = `Premium ${product.name} in ${cityName} - Buy Online | SwissGain India`;
  const pageDescription = `Looking for the best ${product.name} in ${cityName}? Order premium gold-plated imitation jewelry online from SwissGain India. Fast delivery to ${cityName}.`;
  
  // Structured Schema Markup
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': `${product.name} in ${cityName}`,
    'image': product.image ? (product.image.startsWith('http') ? product.image : `https://swissgainindia.com${product.image}`) : FALLBACK_IMAGE,
    'description': product.description || `Buy Swiss-crafted 1 gram gold plated ${product.name} online. Hand-delivered across ${cityName}.`,
    'sku': product._id,
    'offers': {
      '@type': 'Offer',
      'url': window.location.href,
      'priceCurrency': 'INR',
      'price': product.price,
      'priceValidUntil': new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'seller': {
        '@type': 'Organization',
        'name': 'SwissGain India'
      }
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <SEO 
        title={pageTitle}
        description={pageDescription}
        image={product.image}
        url={`/buy/${product.slug}-in-${citySlug}`}
        type="product"
      />
      
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      {/* Top Banner with Localized Indicator */}
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-950 text-amber-50 py-3 text-center text-sm font-medium shadow-sm sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center space-x-2">
          <MapPin className="h-4 w-4 animate-bounce text-amber-300" />
          <span>Special Offer: Free Express Shipping to <strong>{cityName}</strong> + Cash on Delivery!</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-amber-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-amber-700 transition-colors">Products</Link>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        {/* Localized Greeting and H1 */}
        <div className="mb-10 text-center lg:text-left bg-gradient-to-r from-amber-50 to-orange-50/30 p-6 rounded-2xl border border-amber-100 shadow-sm">
          <div className="inline-flex items-center space-x-2 bg-amber-100/60 text-amber-900 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="h-3 w-3 text-amber-700" />
            <span>Exclusive Collection in {cityName}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-none mb-3">
            Premium <span className="text-amber-700">{product.name}</span> in {cityName}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Order exquisite 1 Gram Gold Plated imitation jewelry crafted with Swiss precision. Enjoy door-step delivery in {cityName} with easy cash on delivery.
          </p>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          {/* Left Side: Product Image Showcase */}
          <div className="lg:col-span-6 space-y-6">
            <Card className="overflow-hidden border-2 border-amber-100 shadow-xl rounded-2xl bg-white">
              <CardContent className="p-0 relative">
                <img
                  src={getOptimizedImageUrl(product.image, 600)}
                  alt={`${product.name} premium design available in ${cityName}`}
                  loading="eager"
                  className="w-full h-[400px] sm:h-[500px] object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                />
                
                {discount > 0 && (
                  <Badge variant="destructive" className="absolute top-4 left-4 text-base px-3 py-1 shadow-lg bg-red-600">
                    {discount}% OFF
                  </Badge>
                )}

                <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>In high demand in {cityName}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 text-center shadow-sm">
                <Truck className="h-6 w-6 text-amber-700 mx-auto mb-2" />
                <span className="text-xs font-bold block text-gray-900">Express Delivery</span>
                <span className="text-[10px] text-muted-foreground">To {cityName}</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 text-center shadow-sm">
                <ShieldCheck className="h-6 w-6 text-amber-700 mx-auto mb-2" />
                <span className="text-xs font-bold block text-gray-900">100% Quality</span>
                <span className="text-[10px] text-muted-foreground">Premium Gold Polish</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 text-center shadow-sm">
                <RefreshCw className="h-6 w-6 text-amber-700 mx-auto mb-2" />
                <span className="text-xs font-bold block text-gray-900">Easy Returns</span>
                <span className="text-[10px] text-muted-foreground">7-Day Warranty</span>
              </div>
            </div>
          </div>

          {/* Right Side: Configuration & Call to Action */}
          <div className="lg:col-span-6 space-y-8 bg-white p-8 rounded-2xl border border-slate-100 shadow-lg">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4.5 w-4.5 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-600">(4.9/5 stars based on buyers in {cityName})</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h2>
              
              <p className="text-gray-600 leading-relaxed">
                {product.description || `Indulge in the finest Swiss-crafted jewelry. This premium ${product.name} features an authentic 1 gram gold plating that offers a brilliant shine indistinguishable from pure gold. Hypoallergenic, robust, and designed for longevity.`}
              </p>
            </div>

            {/* Price block */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block uppercase tracking-wider font-semibold">Special Local Price</span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <span className="text-3xl font-extrabold text-amber-800">₹{product.price}</span>
                  {originalPrice > product.price && (
                    <span className="text-lg text-slate-400 line-through">₹{originalPrice}</span>
                  )}
                </div>
              </div>
              
              {discount > 0 && (
                <div className="bg-amber-100 text-amber-900 border border-amber-200 px-3.5 py-1.5 rounded-lg text-sm font-extrabold shadow-sm">
                  Save ₹{originalPrice - product.price}!
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold text-gray-700">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-55 overflow-hidden">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-3.5 py-2 hover:bg-slate-100 font-bold transition-colors border-r border-slate-200"
                >
                  -
                </button>
                <span className="px-5 py-2 font-semibold text-gray-800 bg-white min-w-[50px] text-center">
                  {quantity}
                </span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-3.5 py-2 hover:bg-slate-100 font-bold transition-colors border-l border-slate-200"
                >
                  +
                </button>
              </div>
              
              {!isInStock && (
                <span className="text-red-500 font-bold text-sm">Temporarily Out of Stock</span>
              )}
            </div>

            {/* CTA Buy Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={handleAddToCart}
                disabled={!isInStock}
                variant="outline"
                className="border-slate-300 hover:border-amber-700 hover:bg-amber-50/50 text-slate-800 font-semibold py-6 rounded-xl transition-all duration-300 shadow-sm"
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
              <Button 
                onClick={handleBuyNow}
                disabled={!isInStock}
                className="bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-bold py-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01]"
              >
                <ShoppingBag className="mr-2 h-5 w-5" /> Buy Now (Free Delivery)
              </Button>
            </div>

            {/* Local delivery info */}
            <div className="border-t border-slate-100 pt-6 space-y-3.5">
              <div className="flex items-start space-x-3 text-sm">
                <Truck className="h-5 w-5 text-amber-700 mt-0.5" />
                <div>
                  <strong className="text-gray-900 block">Fast Shipping to {cityName}</strong>
                  <span className="text-muted-foreground text-xs">Standard dispatch is within 24 hours. Delivery takes 2-4 business days.</span>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-sm">
                <ShieldCheck className="h-5 w-5 text-amber-700 mt-0.5" />
                <div>
                  <strong className="text-gray-900 block">COD & Online Payments</strong>
                  <span className="text-muted-foreground text-xs">Pay securely with UPI, Cards, NetBanking, or cash on delivery.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Localized FAQ Section */}
        <div className="mb-16 bg-white p-8 rounded-2xl border border-slate-100 shadow-md">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-amber-700" />
            Frequently Asked Questions for Buyers in {cityName}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-base">Does SwissGain India deliver to all areas of {cityName}?</h4>
              <p className="text-gray-600 text-sm">
                Yes! We ship across all pincodes and neighborhoods in {cityName} and surrounding districts. All orders are sent via reliable express courier partners.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-base">Is Cash on Delivery (COD) available in {cityName}?</h4>
              <p className="text-gray-600 text-sm">
                Absolutely. COD is available for all addresses in {cityName} at no extra cost. You can also pay the courier executive via UPI upon delivery.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-base">What is the quality guarantee of SwissGain jewelry?</h4>
              <p className="text-gray-600 text-sm">
                All our products feature a premium 1 gram gold plating. The base is premium allergy-safe alloy, ensuring long-lasting color retention and comfort for daily wear.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-base">What is the return/exchange policy?</h4>
              <p className="text-gray-600 text-sm">
                We offer a hassle-free 7-day warranty replacement or refund policy. If your product arrives damaged or isn't as expected, simply contact support for a pickup from {cityName}.
              </p>
            </div>
          </div>
        </div>

        {/* Local Brand Trust Section */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <Award className="h-10 w-10 text-amber-700 mx-auto" />
          <h3 className="text-2xl font-bold text-gray-900">Why {cityName} Loves SwissGain India</h3>
          <p className="text-gray-600 text-base leading-relaxed">
            SwissGain India is the nation's premier destination for high-quality gold-plated imitation jewelry. Inspired by classic Swiss design and modern Indian traditions, our products are crafted to offer luxury at an accessible price. With thousands of happy customers in {cityName}, we take pride in delivering elegance right to your doorstep.
          </p>
          <div className="pt-4">
            <Link href="/products">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg shadow-sm">
                Explore the Full Collection
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
