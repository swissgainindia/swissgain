import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/product-card';
import ProductSkeleton from '@/components/product-skeleton';
import { Search, Filter, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

// --- FIREBASE CONFIGURATION (Same as ProductDetail) ---
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
    let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    database = getDatabase(app);
    return database;
  } catch (error) {
    console.error('Firebase error:', error);
    throw error;
  }
};
const firebaseDatabase = initializeFirebase();

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400?text=No+Image+Available';
const BASE_IMAGE_URL = 'https://swissgainindia.com'; 

interface Product {
  id: string;
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: any;
  image: string;
  images: string[];
  features: string[];
  inStock: boolean;
  stockQuantity: number;
  rating?: number;
  reviews?: number; // Used for display count
  ratingCount?: number; // From backend
  videoType?: 'upload' | 'youtube' | '';
  videoUrl?: string;
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'rings', label: 'Rings' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'sets', label: 'Jewelry Sets' },
  { value: 'chains', label: 'Chains' },
];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);
  
  // Store real-time review stats: { productId: { sum: 50, count: 10 } }
  const [reviewsMap, setReviewsMap] = useState<Record<string, { sum: number, count: number }>>({});

  // 1. Fetch Products from MongoDB (Manual Data)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        const fetchedProducts = res.data.map((product: any) => ({
          ...product,
          id: product._id,
          // Map backend 'ratingCount' to 'reviews' for consistency
          reviews: product.ratingCount || 0, 
          image: product.image
            ? product.image.startsWith('http') ? product.image : `${BASE_IMAGE_URL}${product.image}`
            : FALLBACK_IMAGE,
          images: product.images
            ? Array.isArray(product.images)
              ? product.images.map((img: string) => img.startsWith('http') ? img : `${BASE_IMAGE_URL}${img}`)
              : product.images.split(',').map((s: string) => s.trim()).filter((s: string) => s).map((img: string) => (img.startsWith('http') ? img : `${BASE_IMAGE_URL}${img}`))
            : [],
          features: product.features || [],
          videoType: product.videoType || "",
          videoUrl: product.videoUrl || "",
        }));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. Fetch All Reviews from Firebase (Real Data)
  useEffect(() => {
    const reviewsRef = ref(firebaseDatabase, 'reviews');
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const map: Record<string, { sum: number, count: number }> = {};
        
        // Loop through each product's reviews
        Object.entries(data).forEach(([pId, pReviews]: [string, any]) => {
          const reviewsList = Object.values(pReviews);
          const sum = reviewsList.reduce((acc: number, r: any) => acc + Number(r.rating), 0);
          const count = reviewsList.length;
          map[pId] = { sum, count };
        });
        setReviewsMap(map);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Merge Manual + Real Data to get Final Ratings
  const processedProducts = useMemo(() => {
    return products.map(product => {
      // Manual Stats (from MongoDB)
      const manualRating = product.rating ? Number(product.rating) : 0;
      const manualCount = product.reviews ? Number(product.reviews) : 0; // Mapped from ratingCount
      const manualSum = manualRating * manualCount;

      // Real Stats (from Firebase)
      const realData = reviewsMap[product._id] || { sum: 0, count: 0 };

      // Weighted Calculation
      const totalCount = manualCount + realData.count;
      const totalSum = manualSum + realData.sum;
      const finalAvg = totalCount > 0 ? totalSum / totalCount : 0;

      return {
        ...product,
        rating: Number(finalAvg.toFixed(1)), // Overwrite with calculated average
        reviews: totalCount // Overwrite with total count
      };
    });
  }, [products, reviewsMap]);

  // 4. Filter and Sort (using processedProducts)
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...processedProducts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    switch (sortBy) {
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break; // Now sorts by combined rating
      case 'newest': break; // Assuming API default
      default: break;
    }

    return filtered;
  }, [processedProducts, searchQuery, selectedCategory, sortBy]);

  const pageSize = 12;
  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (activePage - 1) * pageSize;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, startIndex + pageSize);

  if (loading) {
    return (
      <div className="py-20 bg-muted min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded animate-pulse w-64 mb-4" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-muted min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Our Jewelry Collection</h1>
          <p className="text-xl text-muted-foreground">Discover our exquisite range of Swiss-crafted jewelry pieces</p>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className={selectedCategory === category.value ? 'gradient-primary text-primary-foreground' : ''}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Search jewelry..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}><Grid3X3 className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">{filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {paginatedProducts.map((product) => (
            //  This Card will now receive the combined rating and review count
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* Premium Public Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 mt-8">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(startIndex + pageSize, filteredAndSortedProducts.length)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{filteredAndSortedProducts.length}</span> products
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={activePage === 1}
                className="h-9 px-3 text-xs bg-white"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={activePage === 1}
                className="h-9 px-3 text-xs bg-white"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1.5 mx-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - activePage) <= 1)
                  .map((page, idx, arr) => {
                    const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <div key={page} className="flex items-center gap-1.5">
                        {showEllipsis && <span className="text-muted-foreground text-xs px-1">...</span>}
                        <Button
                          variant={activePage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`h-9 w-9 text-xs p-0 bg-white ${
                            activePage === page ? "gradient-primary text-primary-foreground font-bold border-0" : ""
                          }`}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={activePage === totalPages}
                className="h-9 px-3 text-xs bg-white"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPage(totalPages);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={activePage === totalPages}
                className="h-9 px-3 text-xs bg-white"
              >
                Last
              </Button>
            </div>
          </div>
        )}

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💎</div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No products found</h3>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSortBy('featured'); }}>Clear All Filters</Button>
          </div>
        )}

        {selectedCategory === 'all' && searchQuery === '' && (
          <div className="mt-16 bg-[#d97706] rounded-2xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Explore Our Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(1).map((category) => (
                <Button key={category.value} variant="outline" className="border-white text-primary hover:bg-white hover:text-primary" onClick={() => setSelectedCategory(category.value)}>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}