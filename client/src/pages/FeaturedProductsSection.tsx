import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card.tsx"; // make sure this exists
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await axios.get("/api/products"); // your API route
      setProducts(res.data.slice(0, 8));
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading products...</div>;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <Button
              variant="outline"
              className="hidden md:flex items-center"
            >
              View All Products
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

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
