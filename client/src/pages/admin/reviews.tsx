'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, remove } from 'firebase/database';
import { Trash2, Star, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface Review {
  id: string;
  productId: string;
  productName?: string; // This will now come from the review itself
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  // kept as fallback for older reviews
  const [productsMap, setProductsMap] = useState<Record<string, string>>({}); 

  useEffect(() => {
    // 1. Fetch Products (Fallback for old reviews)
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const map: Record<string, string> = {};
        Object.entries(data).forEach(([key, val]: any) => {
          map[key] = val.name;
        });
        setProductsMap(map);
      }
    });

    // 2. Fetch Reviews
    const reviewsRef = ref(database, 'reviews');
    onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      const allReviews: Review[] = [];

      if (data) {
        Object.entries(data).forEach(([productId, productReviews]: [string, any]) => {
          Object.entries(productReviews).forEach(([reviewId, review]: [string, any]) => {
            allReviews.push({
              id: reviewId,
              productId: productId,
              ...review 
            });
          });
        });
        // Sort by newest first
        allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      
      setReviews(allReviews);
      setLoading(false);
    });
  }, []);

  const handleDeleteReview = async (productId: string, reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await remove(ref(database, `reviews/${productId}/${reviewId}`));
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading reviews...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Review Management</h2>
        <Badge variant="secondary" className="text-lg px-4 py-1">
          Total: {reviews.length}
        </Badge>
      </div>

      {reviews.length === 0 ? (
        <Alert><MessageSquare className="h-4 w-4" /><AlertDescription>No reviews found.</AlertDescription></Alert>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{review.userName}</Badge>
                      <span className="text-sm text-gray-500">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {/* ✅ FIX: Prioritize the name saved in review, fallback to map, fallback to Unknown */}
                      <span className="text-purple-600">
                        {review.productName || productsMap[review.productId] || 'Product Name Unavailable'}
                      </span>
                      <a href={`/product/${review.productId}`} target="_blank" rel="noreferrer">
                         <ExternalLink className="h-4 w-4 text-gray-400 hover:text-purple-600" />
                      </a>
                    </h3>

                    <div className="flex items-center gap-1 text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>

                  <div className="flex-[2] bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-gray-700 italic">"{review.comment}"</p>
                  </div>

                  <div className="flex flex-col justify-center items-end">
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteReview(review.productId, review.id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}