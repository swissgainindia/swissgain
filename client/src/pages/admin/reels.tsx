'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Film, Upload, Play, CheckCircle, XCircle, Trash2, 
  Sparkles, ExternalLink, RefreshCw, AlertCircle, Clock
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Upload States
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
      const res = await axios.get('/api/admin/reels');
      setReels(res.data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch reels.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
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
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('image', videoFile);

      toast({
        title: "Uploading Video...",
        description: "Uploading official review reel to Cloudinary.",
      });

      const uploadRes = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const videoUrl = uploadRes.data.imageUrl;

      // 2. Save approved reel
      await axios.post('/api/reels', {
        videoUrl,
        productId: selectedProductId,
        isAdmin: true // Sets status to 'approved' immediately
      });

      toast({
        title: "Official Reel Published! 🎉",
        description: "Your official product reel has been set to live immediately.",
      });

      // Reset
      setSelectedProductId('');
      setVideoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchReels();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to Upload",
        description: err.response?.data?.message || "Upload encountered an error.",
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
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update reel status.",
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
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to delete reel.",
        variant: "destructive"
      });
    }
  };

  const filteredReels = reels.filter(reel => {
    if (statusFilter === 'all') return true;
    return reel.status === statusFilter;
  });

  return (
    <div className="space-y-8 p-4 md:p-6 text-left">
      {/* Upload Panel */}
      <Card className="border border-amber-500/10">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Film className="h-5 w-5 text-amber-600" />
            Upload Official Shoppable Reel
          </CardTitle>
          <CardDescription>
            Publish approved, professional product videos directly to the client discovery feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUploadOfficial} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Product</Label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-sm bg-background border border-border rounded-lg p-2 outline-none focus:ring-1 focus:ring-amber-500"
                required
              >
                <option value="">-- Choose Jewelry --</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload MP4 Video</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  ref={fileInputRef}
                  type="file" 
                  accept="video/mp4" 
                  onChange={handleFileChange}
                  className="text-xs bg-background"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploading}
              className="gradient-gold text-accent-foreground font-semibold py-2.5 h-10 flex items-center justify-center gap-2"
            >
              {uploading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Publish Direct to Live
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List / Management Panel */}
      <Card className="border border-border/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Shoppable Reels Registry</CardTitle>
            <CardDescription>Manage user submissions and official brand promotional reels.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(filter => (
              <Button
                key={filter}
                variant={statusFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className="text-xs capitalize"
              >
                {filter}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={fetchReels} className="p-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <Sparkles className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading reels metadata...</p>
            </div>
          ) : filteredReels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
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
                  <TableRow key={reel._id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <img 
                          src={reel.productId?.image || '/placeholder.png'} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded border border-border"
                        />
                        <span className="truncate max-w-[120px]">{reel.productId?.name || 'Deleted Product'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {reel.userId ? (
                        <div>
                          <p className="font-bold text-xs">@{reel.userId.username}</p>
                          <p className="text-[10px] text-muted-foreground">{reel.userId.email}</p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/5 text-amber-700 border-amber-500/10">Official Brand</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(reel.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      {reel.status === 'approved' && (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10">
                          <CheckCircle className="h-3 w-3 mr-1 inline" /> Live
                        </Badge>
                      )}
                      {reel.status === 'pending' && (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/10">
                          <Clock className="h-3 w-3 mr-1 inline animate-pulse" /> Pending
                        </Badge>
                      )}
                      {reel.status === 'rejected' && (
                        <Badge className="bg-rose-500/10 text-rose-700 border-rose-500/20 hover:bg-rose-500/10">
                          <XCircle className="h-3 w-3 mr-1 inline" /> Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Play Preview */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPreviewVideoUrl(reel.videoUrl)}
                          className="text-xs flex items-center gap-1 px-2.5 h-8"
                        >
                          <Play className="h-3 w-3" /> Review Video
                        </Button>

                        {/* Approve/Reject Controls (only if pending or rejected) */}
                        {reel.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(reel._id, 'approved')}
                            className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/5 p-2 h-8"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {reel.status !== 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(reel._id, 'rejected')}
                            className="border-rose-600/30 text-rose-700 hover:bg-rose-500/5 p-2 h-8"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Permanent Delete */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(reel._id)}
                          className="text-destructive border-destructive/20 hover:bg-destructive/5 p-2 h-8"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Video Preview Modal Dialog */}
      <Dialog open={!!previewVideoUrl} onOpenChange={() => setPreviewVideoUrl(null)}>
        <DialogContent className="max-w-md bg-black/95 border-neutral-800 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-base">Video Review Preview</DialogTitle>
          </DialogHeader>
          <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
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
