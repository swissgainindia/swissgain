import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";
import { ChevronRight } from "lucide-react";
import axios from "axios";

interface Product {
  _id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  inStock: boolean;
  stockQuantity: number;
  description: string;
}

export default function FeaturedProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await axios.get("/api/products");

      const data = res.data;

      // ✅ Normalize response → ALWAYS an array
      let productList: Product[] = [];

      if (Array.isArray(data)) {
        productList = data;
      } else if (Array.isArray(data?.products)) {
        productList = data.products;
      } else if (typeof data === "object" && data !== null) {
        productList = Object.values(data);
      }

      setProducts(productList.slice(0, 8));
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-4 font-primary">
              Featured Products
            </h2>
            <p className="text-xl text-muted-foreground">
              Handpicked selections from our premium collection
            </p>
          </div>

          <a href="/products">
            <Button variant="outline" className="hidden md:flex items-center">
              View All Products
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">
              No featured products found.
            </p>
          )}
        </div>

        {/* Mobile CTA */}
        <div className="text-center md:hidden">
          <a href="/products">
            <Button variant="outline">
              View All Products
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
