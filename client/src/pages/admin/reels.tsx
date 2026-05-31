'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Film, Upload, Play, CheckCircle, XCircle, Trash2, 
  Sparkles, RefreshCw, AlertCircle, Clock, Plus
} from 'lucide-react';
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
  userId?: { _id: string; username: string; email: string };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Upload States (now inside modal Dialog)
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Preview State
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReels();
    fetchProducts();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/admin/reels');
      if (res && Array.isArray(res.data)) {
        setReels(res.data);
      } else {
        setReels([]);
        setError("Invalid response format received from server.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch reels registry.");
      toast({
        title: "Sync Error",
        description: "Could not fetch reels from the server.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      if (res && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error("Products fetch failed:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/mp4') && !file.name.endsWith('.mp4')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an MP4 video file.",
          variant: "destructive"
        });
        return;
      }
      setVideoFile(file);
    }
  };

  const handleUploadOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast({
        title: "Product Required",
        description: "Please choose a product to link with the official reel.",
        variant: "destructive"
      });
      return;
    }
    if (!videoFile) {
      toast({
        title: "Video File Required",
        description: "Please select an MP4 file.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // 1. Upload to Cloudinary via admin upload buffer endpoint
      const formData = new FormData();
      formData.append('image', videoFile);

      toast({
        title: "Uploading Video...",
        description: "Uploading official review reel to Cloudinary.",
      });

      const uploadRes = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const videoUrl = uploadRes.data?.imageUrl;
      if (!videoUrl) {
        throw new Error("Secure URL not returned by Cloudinary.");
      }

      // 2. Save approved reel
      await axios.post('/api/reels', {
        videoUrl,
        productId: selectedProductId,
        isAdmin: true // Auto-sets status to 'approved' immediately
      });

      toast({
        title: "Official Reel Published! 🎉",
        description: "Your official product reel has been set to live immediately.",
      });

      // Reset states & close modal
      setSelectedProductId('');
      setVideoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploadOpen(false);
      
      fetchReels();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload Failed",
        description: err.response?.data?.message || err.message || "Upload encountered an error.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (reelId: string, newStatus: 'approved' | 'rejected') => {
    try {
      await axios.put(`/api/admin/reels/${reelId}/status`, { status: newStatus });
      toast({
        title: "Status Updated",
        description: `Review reel has been ${newStatus}.`,
      });
      fetchReels();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Update Error",
        description: err.response?.data?.message || "Failed to update reel status.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (reelId: string) => {
    if (!confirm("Are you sure you want to delete this reel permanently?")) return;
    try {
      await axios.delete(`/api/admin/reels/${reelId}`);
      toast({
        title: "Deleted",
        description: "Reel has been permanently removed.",
      });
      fetchReels();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Delete Error",
        description: err.response?.data?.message || "Failed to delete reel.",
        variant: "destructive"
      });
    }
  };

  const filteredReels = Array.isArray(reels) 
    ? reels.filter(reel => {
        if (statusFilter === 'all') return true;
        return reel?.status === statusFilter;
      })
    : [];

  return (
    <div className="space-y-8 p-4 md:p-6 text-left">
      {/* Standalone Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-muted/20 p-4 rounded-2xl border border-border/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Film className="h-6 w-6 text-amber-600 animate-pulse" />
            Shoppable Reels Moderator
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Control video reviews, direct-publish brand clips, and manage client feedback.
          </p>
        </div>
        <Button 
          onClick={() => setIsUploadOpen(true)}
          className="gradient-gold text-accent-foreground font-semibold flex items-center gap-2 self-start sm:self-center shadow-lg transition-transform duration-200 hover:scale-105"
        >
          <Plus className="h-4.5 w-4.5" /> Upload Official Reel
        </Button>
      </div>

      {/* Main Registry Table */}
      <Card className="border border-border/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle className="text-lg sm:text-xl">Reels Registry</CardTitle>
            <CardDescription className="text-xs">Browse and moderate all active vertical video review clips.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
              <Button
                key={filter}
                variant={statusFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className="text-xs capitalize h-8"
              >
                {filter}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={fetchReels} className="p-2 h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-4">
          {loading ? (
            <div className="text-center py-16">
              <Sparkles className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground tracking-wide font-medium uppercase">Loading reels metadata...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-rose-500 text-sm">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 text-rose-500 animate-bounce" />
              <p className="font-bold text-base">Crash Guard Activated</p>
              <p className="text-muted-foreground mt-1 text-xs">{error}</p>
              <Button size="sm" variant="outline" className="mt-4 border-rose-500/20 text-rose-500 hover:bg-rose-500/5" onClick={fetchReels}>
                Try Syncing Registry
              </Button>
            </div>
          ) : filteredReels.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
              No reels match the selected status filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Product Detail</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReels.map((reel) => (
                  <TableRow key={reel?._id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <img 
                          src={reel?.productId?.image || '/placeholder.png'} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded-lg border border-border"
                        />
                        <span className="truncate max-w-[120px] text-xs sm:text-sm font-bold">
                          {reel?.productId?.name || 'Deleted Product'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {reel?.userId ? (
                        <div>
                          <p className="font-bold text-xs">@{reel?.userId?.username}</p>
                          <p className="text-[10px] text-muted-foreground leading-normal">{reel?.userId?.email}</p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/5 text-amber-700 border-amber-500/10 text-[10px]">
                          Official Brand
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {reel?.createdAt ? new Date(reel.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {reel?.status === 'approved' && (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10">
                          <CheckCircle className="h-3 w-3 mr-1 inline" /> Live
                        </Badge>
                      )}
                      {reel?.status === 'pending' && (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/10">
                          <Clock className="h-3 w-3 mr-1 inline animate-pulse" /> Pending
                        </Badge>
                      )}
                      {reel?.status === 'rejected' && (
                        <Badge className="bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/10">
                          <XCircle className="h-3 w-3 mr-1 inline" /> Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {/* Play Preview */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPreviewVideoUrl(reel?.videoUrl || null)}
                          className="text-xs flex items-center gap-1 px-2.5 h-8"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" /> Play Review
                        </Button>

                        {/* Approve/Reject Controls */}
                        {reel?.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            title="Approve Reel"
                            onClick={() => handleUpdateStatus(reel._id, 'approved')}
                            className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/5 p-2 h-8 w-8"
                          >
                            <CheckCircle className="h-4.5 w-4.5" />
                          </Button>
                        )}
                        {reel?.status !== 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            title="Reject Reel"
                            onClick={() => handleUpdateStatus(reel._id, 'rejected')}
                            className="border-rose-600/30 text-rose-700 hover:bg-rose-500/5 p-2 h-8 w-8"
                          >
                            <XCircle className="h-4.5 w-4.5" />
                          </Button>
                        )}

                        {/* Delete Control */}
                        <Button
                          variant="outline"
                          size="sm"
                          title="Delete Reel"
                          onClick={() => handleDelete(reel._id)}
                          className="text-destructive border-destructive/20 hover:bg-destructive/5 p-2 h-8 w-8"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Official Reel Modal Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Film className="h-5 w-5 text-amber-600" />
              Publish Official Promo Reel
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload professional marketing content. This reel will go live on the discovery feed immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadOfficial} className="space-y-4 pt-3">
            <div className="space-y-1 text-left">
              <Label htmlFor="admin-product-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Linked Product
              </Label>
              <select
                id="admin-product-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-xl p-2.5 outline-none focus:ring-1 focus:ring-amber-500"
                required
              >
                <option value="">-- Choose Jewelry --</option>
                {Array.isArray(products) && products.map(p => (
                  <option key={p?._id} value={p?._id}>{p?.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1 text-left">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Review Video File (MP4)
              </Label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-amber-500/50 rounded-xl p-6 text-center cursor-pointer bg-muted/20 transition-all duration-200"
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="video/mp4" 
                  onChange={handleFileChange}
                  className="hidden"
                />
                {videoFile ? (
                  <div className="space-y-1">
                    <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold truncate max-w-xs mx-auto">{videoFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB • Selected</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-8 w-8 text-amber-600 mx-auto" />
                    <p className="text-xs font-bold">Select Video File</p>
                    <p className="text-[10px] text-muted-foreground">MP4 Format • Limit 25MB</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 flex justify-end gap-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                type="button" 
                onClick={() => {
                  setIsUploadOpen(false);
                  setSelectedProductId('');
                  setVideoFile(null);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={uploading}
                className="gradient-gold text-accent-foreground font-semibold flex items-center gap-1.5"
              >
                {uploading ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Go Live Immediately
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal Dialog */}
      <Dialog open={!!previewVideoUrl} onOpenChange={() => setPreviewVideoUrl(null)}>
        <DialogContent className="max-w-xs bg-black/95 border-neutral-800 text-white rounded-2xl p-4">
          <DialogHeader className="pb-2 border-b border-neutral-800">
            <DialogTitle className="text-white text-base">Video Review Preview</DialogTitle>
          </DialogHeader>
          <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-neutral-900 flex items-center justify-center mt-3 border border-neutral-800">
            {previewVideoUrl && (
              <video 
                src={previewVideoUrl} 
                controls 
                autoPlay 
                playsInline
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
