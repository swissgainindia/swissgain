import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { addProductToCart } from '@/lib/storage';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
const getOptimizedImageUrl = (url: string, width: number = 400) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
  return url;
};

interface ProductCardProps {
  product: Product;
}
export default function ProductCard({ product }: ProductCardProps) {
  const { updateData } = useLocalStorage();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const isInStock = product.inStock && (product.stockQuantity || 0) > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    if (!isInStock) return;
    e.preventDefault();
    e.stopPropagation();
    // ✅ Ensure product has `id`
    updateData(addProductToCart.bind(null, { ...product, id: product._id }, 1));
    toast({
      title: "Added to Cart",
      description: `${product.name} added to your cart.`,
    });
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&showinfo=0&rel=0&enablejsapi=1`;
    }
    return url;
  };

  return (
    <Link href={`/product/${product._id}`}>
      <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden">
        <div 
          className="relative overflow-hidden h-64"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {isHovered && product.videoUrl && product.videoType === 'upload' && (
            <video
              src={product.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="none"
              controls={false}
              className="absolute inset-0 w-full h-full object-cover z-10"
            />
          )}

          {isHovered && product.videoUrl && product.videoType === 'youtube' && (
            <div className="absolute inset-0 w-full h-full z-10 overflow-hidden pointer-events-none">
              <iframe
                src={getYouTubeEmbedUrl(product.videoUrl)}
                title={product.name}
                className="w-full h-full border-0 pointer-events-none scale-[1.3]"
                allow="autoplay; encrypted-media"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}

          <img
            src={getOptimizedImageUrl(product.image, 400)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {product.discount && (
            <Badge variant="destructive" className="absolute top-3 left-3 font-semibold">
              {product.discount}% OFF
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 bg-white/80 hover:bg-white text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
          {isInStock && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                onClick={handleAddToCart}
                className="w-full gradient-primary text-primary-foreground"
                size="sm"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Quick Add
              </Button>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex text-accent">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({product.reviews})</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {!isInStock ? (
              <Badge variant="secondary">Out of Stock</Badge>
            ) : product.stockQuantity && product.stockQuantity > 0 && product.stockQuantity < 6 ? (
              <Badge variant="destructive" className="animate-pulse bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-1 border-0">
                🔥 Only {product.stockQuantity} left!
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}