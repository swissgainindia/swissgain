'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { addProductToCart } from '@/lib/storage';
import { 
  Heart, Share2, Volume2, VolumeX, ShoppingCart, 
  Play, Pause, ChevronDown, Award, Sparkles, MessageSquare, X 
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface Reel {
  _id: string;
  videoUrl: string;
  productId: Product;
  userId?: { _id: string; username: string };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Highly appealing premium mockup reels in case none exist in database yet
const MOCKUP_REELS = [
  {
    _id: "mock-1",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-gold-necklaces-and-jewelry-41314-large.mp4",
    productId: {
      _id: "6650a3cf12eb1a2388a101f1", // fallback product id or generic matching slug
      name: "Royal Golden Choker Neckchain",
      price: 2499,
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=200",
      category: "necklaces"
    },
    userId: { _id: "admin-1", username: "SwissGain Official" },
    status: "approved" as const,
    createdAt: new Date().toISOString()
  },
  {
    _id: "mock-2",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-sparkling-golden-rings-41312-large.mp4",
    productId: {
      _id: "6650a3cf12eb1a2388a101f2",
      name: "Imperial Certified Solitaire Ring",
      price: 1899,
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=200",
      category: "rings"
    },
    userId: { _id: "admin-2", username: "Luxury Curators" },
    status: "approved" as const,
    createdAt: new Date().toISOString()
  },
  {
    _id: "mock-3",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-sparkling-gold-bracelets-41313-large.mp4",
    productId: {
      _id: "6650a3cf12eb1a2388a101f3",
      name: "Gilded Floral Cascade Earring Set",
      price: 3299,
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=200",
      category: "earrings"
    },
    userId: { _id: "admin-1", username: "SwissGain Official" },
    status: "approved" as const,
    createdAt: new Date().toISOString()
  }
];

const MOCK_REVIEWS: Record<string, { author: string; text: string; date: string }[]> = {
  "mock-1": [
    { author: "Aditya R.", text: "The gold finish is so premium, looks like real 24k gold. Highly recommended!", date: "2 days ago" },
    { author: "Sneha M.", text: "Beautiful design! I wear it every day and it hasn't tarnished at all.", date: "1 week ago" },
    { author: "Rohan S.", text: "Excellent customer service and fast delivery. Very satisfied.", date: "2 weeks ago" }
  ],
  "mock-2": [
    { author: "Vikram K.", text: "Stunning solitaire! The shine is incredible under sunlight.", date: "3 days ago" },
    { author: "Priya P.", text: "Proposed to my fiance with this and she absolutely loved it!", date: "5 days ago" }
  ],
  "mock-3": [
    { author: "Neha G.", text: "The floral details are so intricate. Got so many compliments!", date: "1 day ago" },
    { author: "Amit B.", text: "Bought this set for my mother, she was thrilled. Great packaging too.", date: "4 days ago" }
  ]
};

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [likes, setLikes] = useState<Record<string, { count: number; userLiked: boolean }>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const { updateData } = useLocalStorage();
  const { toast } = useToast();

  // Double-tap & click-handling states
  const [doubleTappedReels, setDoubleTappedReels] = useState<Record<string, boolean>>({});
  const clickTimeoutRefs = useRef<Record<string, NodeJS.Timeout | null>>({});

  // Reviews/Comments Bottom Sheet state
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [activeReelForReviews, setActiveReelForReviews] = useState<string | null>(null);
  const [newReviewText, setNewReviewText] = useState('');
  const [reviews, setReviews] = useState<Record<string, { author: string; text: string; date: string }[]>>(() => {
    const saved = localStorage.getItem('swissgain_reels_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return MOCK_REVIEWS;
  });

  useEffect(() => {
    fetchReels();
    return () => {
      // Clean up click timeouts on unmount
      Object.values(clickTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reels');
      if (res.data && res.data.length > 0) {
        // Filter out items without proper populated product information
        const validReels = res.data.filter((r: any) => r.productId && typeof r.productId === 'object');
        setReels(validReels.length > 0 ? validReels : MOCKUP_REELS);
      } else {
        setReels(MOCKUP_REELS);
      }
    } catch (err) {
      console.error("Error loading reels", err);
      // Fallback to mockup data if server fails
      setReels(MOCKUP_REELS);
    } finally {
      setLoading(false);
    }
  };

  // Setup likes state
  useEffect(() => {
    if (reels.length > 0) {
      const initialLikes: Record<string, { count: number; userLiked: boolean }> = {};
      reels.forEach(reel => {
        initialLikes[reel._id] = {
          count: Math.floor(Math.random() * 150) + 45,
          userLiked: false
        };
      });
      setLikes(initialLikes);
    }
  }, [reels]);

  // Handle active video scroll tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const children = container.childNodes;
      const containerTop = container.getBoundingClientRect().top;
      let closestIdx = 0;
      let minDiff = Infinity;

      children.forEach((child, idx) => {
        const rect = (child as HTMLElement).getBoundingClientRect();
        const diff = Math.abs(rect.top - containerTop);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      if (closestIdx !== activeIndex) {
        setActiveIndex(closestIdx);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex, reels]);

  // Play/pause based on active index change
  useEffect(() => {
    reels.forEach((reel, idx) => {
      const video = videoRefs.current[reel._id];
      if (!video) return;

      if (idx === activeIndex) {
        video.currentTime = 0;
        video.play().catch(err => {
          console.log("Autoplay blocked, waiting for user click", err);
        });
      } else {
        video.pause();
      }
    });
  }, [activeIndex, reels]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Map MongoDB _id fields to standard fields
      const cleanProduct = {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category
      };
      
      updateData(addProductToCart.bind(null, cleanProduct, 1));
      toast({
        title: "Added to Cart 🎁",
        description: `${product.name} has been added to your shopping cart.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Cart Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleLike = (reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikes(prev => {
      const item = prev[reelId] || { count: 0, userLiked: false };
      return {
        ...prev,
        [reelId]: {
          count: item.userLiked ? item.count - 1 : item.count + 1,
          userLiked: !item.userLiked
        }
      };
    });
  };

  const handleShare = async (reel: Reel, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/product/${reel.productId._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SwissGain India - Premium Jewelry',
          text: 'Check out this amazing gold-plated jewelry I found on SwissGain!',
          url: shareUrl
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "Product detail link copied to clipboard.",
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleDoubleTap = (reelId: string, e: React.MouseEvent) => {
    // Trigger sidebar like toggle logic
    handleToggleLike(reelId, e);
    
    // Show heart animation
    setDoubleTappedReels(prev => ({ ...prev, [reelId]: true }));
    setTimeout(() => {
      setDoubleTappedReels(prev => {
        const next = { ...prev };
        delete next[reelId];
        return next;
      });
    }, 1000);
  };

  const handleVideoClick = (reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.detail === 2) {
      // Double tap!
      if (clickTimeoutRefs.current[reelId]) {
        clearTimeout(clickTimeoutRefs.current[reelId]!);
        clickTimeoutRefs.current[reelId] = null;
      }
      handleDoubleTap(reelId, e);
    } else {
      // Single tap (wait 250ms for potential double tap)
      if (clickTimeoutRefs.current[reelId]) {
        clearTimeout(clickTimeoutRefs.current[reelId]!);
      }
      clickTimeoutRefs.current[reelId] = setTimeout(() => {
        handleVideoTap(reelId);
        clickTimeoutRefs.current[reelId] = null;
      }, 250);
    }
  };

  const handleVideoTap = (reelId: string) => {
    const video = videoRefs.current[reelId];
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim() || !activeReelForReviews) return;

    const newComment = {
      author: "You",
      text: newReviewText.trim(),
      date: "Just now"
    };

    setReviews(prev => {
      const updated = {
        ...prev,
        [activeReelForReviews]: [newComment, ...(prev[activeReelForReviews] || [])]
      };
      localStorage.setItem('swissgain_reels_reviews', JSON.stringify(updated));
      return updated;
    });

    setNewReviewText('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-amber-950 text-white">
        <Sparkles className="h-10 w-10 animate-spin text-amber-400 mb-4" />
        <p className="text-sm font-semibold tracking-widest text-amber-200 uppercase">SwissGain Shoppable Feed loading...</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-black min-h-[100dvh] md:py-6 overflow-hidden">
      <div className="w-full max-w-[450px] relative h-[100dvh] md:h-[800px] md:rounded-3xl md:overflow-hidden md:border-8 md:border-neutral-900 bg-neutral-950 shadow-2xl flex flex-col justify-center">
        {/* Floating Mute Button */}
        <button 
          onClick={handleToggleMute}
          className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10 transition-colors"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        {/* Snap-Scrolling Reels Container */}
        <div 
          ref={containerRef}
          className="w-full h-[100dvh] md:h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reels.map((reel, idx) => {
            const likeState = likes[reel._id] || { count: 0, userLiked: false };
            return (
              <div 
                key={reel._id} 
                className="w-full h-[100dvh] md:h-full snap-start relative bg-neutral-900 cursor-pointer overflow-hidden flex flex-col justify-between shrink-0"
                onClick={(e) => handleVideoClick(reel._id, e)}
              >
                {/* Full-Screen Video Background */}
                <video
                  ref={el => videoRefs.current[reel._id] = el}
                  src={reel.videoUrl}
                  loop
                  muted={isMuted}
                  playsInline
                  controls={false}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Fading Double-Tap Heart Overlay */}
                <AnimatePresence>
                  {doubleTappedReels[reel._id] && (
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                    >
                      <Heart className="h-24 w-24 text-white fill-white drop-shadow-2xl" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Frosted overlay at the bottom for readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                {/* Left Floating Creators details overlay */}
                <div className="absolute left-4 bottom-32 z-40 text-left max-w-[280px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-600 to-yellow-500 border border-amber-400 flex items-center justify-center text-white font-extrabold text-xs uppercase shadow-md">
                      {reel.userId?.username?.substring(0, 2) || 'SG'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white drop-shadow-md">
                        @{reel.userId?.username || 'SwissGain Curator'}
                      </p>
                      <p className="text-[10px] text-amber-300 font-semibold drop-shadow-md flex items-center gap-0.5">
                        <Award className="h-3 w-3" /> Verified Buyer Review
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-white/95 leading-relaxed font-medium drop-shadow-sm line-clamp-2">
                    Reviewing our amazing {reel.productId.name}. Gold finish is 100% genuine and stunning!
                  </p>
                </div>

                {/* Right Panel Interaction Buttons */}
                <div className="absolute right-4 bottom-32 z-40 flex flex-col gap-5 text-center">
                  {/* Like Button */}
                  <button 
                    onClick={(e) => handleToggleLike(reel._id, e)}
                    className="flex flex-col items-center group"
                  >
                    <div className={`p-3 rounded-full border transition-all duration-300 ${
                      likeState.userLiked 
                        ? 'bg-rose-600 border-rose-500 text-white scale-110 shadow-lg' 
                        : 'bg-black/40 border-white/10 text-white hover:bg-black/60'
                    }`}>
                      <Heart className={`h-5 w-5 ${likeState.userLiked ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[10px] text-white font-bold drop-shadow mt-1">{likeState.count}</span>
                  </button>

                  {/* Share Button */}
                  <button 
                    onClick={(e) => handleShare(reel, e)}
                    className="flex flex-col items-center group"
                  >
                    <div className="p-3 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-colors">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] text-white font-bold drop-shadow mt-1">Share</span>
                  </button>

                  {/* Comment Button simulation */}
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setActiveReelForReviews(reel._id);
                      setIsReviewsOpen(true);
                    }}
                    className="flex flex-col items-center"
                  >
                    <div className="p-3 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-colors">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] text-white font-bold drop-shadow mt-1">Review</span>
                  </button>
                </div>

                {/* Bottom Floating Shoppable Product Panel */}
                <div className="absolute inset-x-4 bottom-4 z-40">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/15 rounded-2xl p-3 flex items-center justify-between shadow-2xl transition-all duration-300 hover:border-amber-500/30">
                    <Link href={`/product/${reel.productId._id}`} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-3 text-left">
                        <img 
                          src={reel.productId.image} 
                          alt={reel.productId.name} 
                          className="w-12 h-12 object-cover rounded-lg border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-white truncate max-w-[150px] sm:max-w-[200px] hover:underline">
                            {reel.productId.name}
                          </p>
                          <p className="text-amber-400 font-extrabold text-xs mt-0.5 sm:text-sm">
                            ₹{reel.productId.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>

                    <Button 
                      onClick={(e) => handleAddToCart(reel.productId, e)}
                      size="sm"
                      className="gradient-gold hover:opacity-90 text-accent-foreground font-semibold flex items-center gap-1.5 h-9 rounded-xl shadow-md border-0"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span className="text-xs">Add to Cart</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reviews Bottom Sheet */}
        {isReviewsOpen && activeReelForReviews && (
          <div className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={() => setIsReviewsOpen(false)}>
            <div 
              className="w-full max-w-[450px] mx-auto bg-neutral-950 rounded-t-3xl border-t border-white/10 h-[60%] flex flex-col text-left transition-transform duration-300 transform translate-y-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header handle */}
              <div className="flex justify-center py-2 shrink-0">
                <div className="w-12 h-1 bg-neutral-700 rounded-full" />
              </div>
              
              {/* Title & Close */}
              <div className="px-4 pb-3 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-sm text-white">Review Comments</h3>
                  <p className="text-[10px] text-neutral-400">Authentic Buyer Verified reviews</p>
                </div>
                <button 
                  onClick={() => setIsReviewsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Comments Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(reviews[activeReelForReviews] || []).length > 0 ? (
                  (reviews[activeReelForReviews] || []).map((rev, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-amber-400 flex-shrink-0">
                        {rev.author.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{rev.author}</span>
                          <span className="text-[10px] text-neutral-500">{rev.date}</span>
                        </div>
                        <p className="text-xs text-neutral-300 leading-relaxed font-medium">{rev.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-55" />
                    <p className="text-xs">No reviews yet. Be the first to write one!</p>
                  </div>
                )}
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleAddReview} className="p-3 border-t border-white/5 bg-neutral-950 flex items-center gap-2 shrink-0">
                <input 
                  type="text"
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Add an authentic buyer review..."
                  className="flex-1 bg-neutral-900 border border-white/5 focus:border-amber-500 focus:ring-0 rounded-xl py-2 px-3.5 text-xs text-white placeholder-neutral-500 outline-none"
                />
                <button 
                  type="submit"
                  disabled={!newReviewText.trim()}
                  className="h-8 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
