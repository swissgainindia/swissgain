import { Card, CardContent } from "@/components/ui/card";

export default function ProductSkeleton() {
  return (
    <Card className="overflow-hidden transition-all duration-300 border border-gray-100 shadow-sm">
      {/* Product Image Shimmer Placeholder */}
      <div className="relative h-64 bg-gray-200 animate-pulse" />
      
      {/* Content Shimmer Placeholders */}
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          {/* Title bar */}
          <div className="h-5 bg-gray-200 rounded animate-pulse w-5/6" />
          {/* Category label */}
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
        </div>
        
        {/* Rating Stars Shimmer Placeholder */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 w-4 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
          {/* Review Count Placeholder */}
          <div className="h-4 bg-gray-200 rounded animate-pulse w-8" />
        </div>
        
        {/* Price & Stock Shimmer Placeholders */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2 w-1/2">
            {/* Active Price */}
            <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
            {/* Original Price */}
            <div className="h-4 bg-gray-200 rounded animate-pulse w-10" />
          </div>
          {/* Out of Stock / In Stock badge placeholder */}
          <div className="h-5 bg-gray-200 rounded-full animate-pulse w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
