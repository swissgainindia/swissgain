import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/product-card';
import { Search, Filter, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import axios from 'axios';

// Fallback image URL
const FALLBACK_IMAGE = 'https://via.placeholder.com/400x400?text=No+Image+Available';

// Base URL for images (replace with your backend's base URL)
const BASE_IMAGE_URL = 'http://localhost:5000'; // Update with your actual backend URL

// Define product type based on API response (aligned with ProductForm and AdminProducts)
interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  image: string;
  images?: string[] | string; // Can be an array or comma-separated string
  features?: string[];
  inStock: boolean;
  stockQuantity: number;
  rating?: number;
  reviews?: number;
}

const categories: { value: string | 'all'; label: string }[] = [
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
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        const fetchedProducts = res.data.map((product: Product) => ({
          ...product,
          image: product.image
            ? product.image.startsWith('http')
              ? product.image
              : `${BASE_IMAGE_URL}${product.image}`
            : FALLBACK_IMAGE,
          images: product.images
            ? Array.isArray(product.images)
              ? product.images.map((img) =>
                  img.startsWith('http') ? img : `${BASE_IMAGE_URL}${img}`
                )
              : product.images
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s)
                  .map((img) => (img.startsWith('http') ? img : `${BASE_IMAGE_URL}${img}`))
            : [],
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

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        // Assume API returns newest first; no sorting needed
        break;
      default:
        // Featured - keep original order
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);

  if (loading) {
    return <div className="py-20 text-center text-xl">Loading products...</div>;
  }

  return (
    <div className="py-20 bg-muted min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Our Jewelry Collection</h1>
          <p className="text-xl text-muted-foreground">
            Discover our exquisite range of Swiss-crafted jewelry pieces
          </p>
        </div>

        {/* Category Pills */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className={selectedCategory === category.value ? 'gradient-primary text-primary-foreground' : ''}
                data-testid={`button-category-${category.value}`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search jewelry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="select-sort-products">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                data-testid="button-grid-view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Results Count */}
            <div className="text-right">
              <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* No Results */}
        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💎</div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSortBy('featured');
              }}
              data-testid="button-clear-filters"
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Featured Categories Banner */}
        {selectedCategory === 'all' && searchQuery === '' && (
          <div className="mt-16 bg-[#d97706] rounded-2xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Explore Our Categories</h2>
            <p className="text-gray-100 mb-8 max-w-2xl mx-auto">
              From elegant necklaces to stunning rings, discover the perfect piece for every occasion
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(1).map((category) => (
                <Button
                  key={category.value}
                  variant="outline"
                  className="border-white text-primary hover:bg-white hover:text-primary"
                  onClick={() => setSelectedCategory(category.value)}
                  data-testid={`button-explore-${category.value}`}
                >
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
