'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Video, Upload, AlertCircle, CheckCircle, Clock, XCircle, Film, Sparkles, Eye, Heart, Trash2 } from 'lucide-react';
import axios from 'axios';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
}

interface Reel {
  _id: string;
  videoUrl: string;
  productId: Product;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface DashboardReelsContentProps {
  userId: string | null;
}

export function DashboardReelsContent({ userId }: DashboardReelsContentProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [myReels, setMyReels] = useState<Reel[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingReels, setLoadingReels] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    if (userId) {
      fetchMyReels();
    }
  }, [userId]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyReels = async () => {
    try {
      setLoadingReels(true);
      const res = await axios.get('/api/reels');
      // Filter reels matching this user
      if (res.data) {
        const filtered = res.data.filter((r: any) => {
          const rUserId = typeof r.userId === 'object' ? r.userId?._id : r.userId;
          return rUserId === userId;
        });
        setMyReels(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReels(false);
    }
  };

  const handleDeleteReel = async (reelId: string) => {
    if (!confirm("Are you sure you want to delete this reel permanently?")) return;
    try {
      await axios.delete(`/api/reels/${reelId}`, { data: { userId } });
      toast({
        title: "Reel Deleted 🎉",
        description: "Your jewelry review has been successfully removed.",
      });
      fetchMyReels();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Delete Failed",
        description: err.response?.data?.message || "Something went wrong deleting your review.",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/mp4') && !file.name.endsWith('.mp4')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an MP4 video file.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        toast({
          title: "File Too Large",
          description: "Video size must be less than 25MB.",
          variant: "destructive"
        });
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast({
        title: "Product Required",
        description: "Please select the jewelry item you are reviewing.",
        variant: "destructive"
      });
      return;
    }
    if (!videoFile) {
      toast({
        title: "Video File Required",
        description: "Please select an MP4 review video.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file to Cloudinary via the /api/admin/upload route
      const formData = new FormData();
      formData.append('image', videoFile); // Multipart form-data name is 'image'

      toast({
        title: "Uploading Video...",
        description: "Your video review is being securely uploaded to Cloudinary.",
      });

      const uploadRes = await axios.post('/api/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const videoUrl = uploadRes.data.imageUrl;

      if (!videoUrl) {
        throw new Error("Did not receive secure URL from uploader.");
      }

      // 2. Register Reel with pending status
      await axios.post('/api/reels', {
        videoUrl,
        productId: selectedProductId,
        userId: userId,
        isAdmin: false // Users uploads are pending
      });

      toast({
        title: "Reel Submitted Successfully! 🎉",
        description: "Your jewelry review is pending admin approval and will show on the feed once verified.",
      });

      // Reset Form State
      setSelectedProductId('');
      setVideoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload submitted list
      fetchMyReels();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload Failed",
        description: err.response?.data?.message || "Something went wrong uploading your review.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 text-left">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Upload Form Card */}
        <Card className="flex-1 border border-amber-500/10">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Film className="h-5 w-5 text-amber-600" />
              Upload Shoppable Jewelry Review
            </CardTitle>
            <CardDescription>
              Share a short video review (up to 25MB) of your purchased jewelry and help others shop with confidence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="product-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Purchased Product
                </Label>
                <select
                  id="product-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-sm bg-background border border-border rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-amber-500"
                  required
                >
                  <option value="">-- Choose Jewelry Item --</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} (₹{product.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Drop Zone */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Upload MP4 Video
                </Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-amber-500/50 rounded-xl p-8 text-center cursor-pointer bg-muted/30 transition-all duration-200"
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/mp4"
                    className="hidden"
                  />
                  {videoFile ? (
                    <div className="space-y-2">
                      <div className="inline-flex h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 items-center justify-center text-emerald-600">
                        <Video className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold truncate max-w-xs mx-auto text-foreground">
                        {videoFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to Upload
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs text-destructive hover:bg-destructive/5"
                      >
                        Remove Video
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="inline-flex h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/25 items-center justify-center text-amber-600">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        Click or Drag Video Here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MP4 format only • Max file size: 25MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={uploading} 
                className="w-full gradient-gold text-accent-foreground font-semibold py-2.5"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 animate-spin" /> Uploading review...
                  </span>
                ) : 'Submit Review Reel'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Submission Tracker */}
        <Card className="w-full md:w-80 border border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">My Submissions</CardTitle>
            <CardDescription>
              Track approval status of your uploaded jewelry reels.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 md:px-6 max-h-[400px] overflow-y-auto">
            {loadingReels ? (
              <div className="flex justify-center py-8">
                <Sparkles className="h-6 w-6 animate-spin text-amber-600" />
              </div>
            ) : myReels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                No video reviews submitted yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {myReels.map((reel) => (
                  <li key={reel._id} className="p-3 border rounded-xl bg-card hover:bg-muted/10 transition-colors flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate max-w-[130px]">
                        {reel.productId?.name || 'Review Video'}
                      </p>
                      <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                        <span>{new Date(reel.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3 text-neutral-400" /> {(reel as any).views || 0}</span>
                        <span className="flex items-center gap-0.5"><Heart className="h-3 w-3 text-rose-500/85 fill-rose-500/10" /> {(reel as any).likes || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div>
                        {reel.status === 'approved' && (
                          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10 flex items-center gap-1 text-[10px] py-0.5 px-1.5">
                            <CheckCircle className="h-2.5 w-2.5" /> Live
                          </Badge>
                        )}
                        {reel.status === 'pending' && (
                          <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/10 flex items-center gap-1 text-[10px] py-0.5 px-1.5">
                            <Clock className="h-2.5 w-2.5 animate-pulse" /> Pending
                          </Badge>
                        )}
                        {reel.status === 'rejected' && (
                          <Badge className="bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/10 flex items-center gap-1 text-[10px] py-0.5 px-1.5">
                            <XCircle className="h-2.5 w-2.5" /> Rejected
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReel(reel._id)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg flex-shrink-0"
                        title="Delete Reel"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
