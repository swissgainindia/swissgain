import { useEffect, useState } from "react";
import { createProduct, updateProduct } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Star } from "lucide-react";
import axios from "axios";

interface ProductFormProps {
  product?: any;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Initialize form data
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    originalPrice: "",
    discount: "",
    category: "",
    image: "",
    images: "",
    features: "",
    inStock: true,
    stockQuantity: "",
    rating: "0",
    ratingCount: "0",
    videoType: "",
    videoUrl: "",
  });

  // ✅ FIX: Update form data when 'product' prop changes
  useEffect(() => {
    if (product) {
      const generatedSlug = product.slug || (product.name ? product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") : "");

      setFormData({
        name: product.name || "",
        slug: generatedSlug,
        description: product.description || "",
        price: product.price?.toString() || "",
        originalPrice: product.originalPrice?.toString() || "",
        discount: product.discount?.toString() || "",
        category: typeof product.category === 'object' ? (product.category.slug || product.category._id || "") : (product.category || ""),
        image: product.image || "",
        images: Array.isArray(product.images) ? product.images.join(", ") : (product.images || ""),
        features: Array.isArray(product.features) ? product.features.join(", ") : (product.features || ""),
        inStock: product.inStock !== undefined ? product.inStock : true,
        stockQuantity: product.stockQuantity?.toString() || "",
        // Convert numbers to strings for the input fields
        rating: product.rating !== undefined ? product.rating.toString() : "0",
        ratingCount: product.ratingCount !== undefined ? product.ratingCount.toString() : "0",
        videoType: product.videoType || "",
        videoUrl: product.videoUrl || "",
      });
    }
  }, [product]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/categories");
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleInStockChange = (checked: boolean) => {
    setFormData(prev => {
      const newData = { ...prev, inStock: checked };
      if (!checked) newData.stockQuantity = "0";
      return newData;
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from name if we are creating a new product or slug is currently empty
      if (field === "name" && (!product || !prev.slug)) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }
      return updated;
    });
  };

  const handleRatingChange = (value: string) => {
    if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 5)) {
      setFormData(prev => ({ ...prev, rating: value }));
    }
  };

  const handleRatingCountChange = (value: string) => {
    if (value === "" || parseInt(value) >= 0) {
      setFormData(prev => ({ ...prev, ratingCount: value }));
    }
  };

  const removeExistingImage = (urlToRemove: string) => {
    const existing = formData.images ? formData.images.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const updated = existing.filter((url: string) => url !== urlToRemove);
    setFormData(prev => ({ ...prev, images: updated.join(", ") }));
  };

  const removeNewImage = (indexToRemove: number) => {
    const updated = additionalImageFiles.filter((_, idx) => idx !== indexToRemove);
    setAdditionalImageFiles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = formData.image;
      
      // Upload main image
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        imageUrl = data.imageUrl;
      }

      // Upload additional images
      const existingImages = formData.images ? formData.images.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      let additionalImageUrls: string[] = [...existingImages];
      
      if (additionalImageFiles.length > 0) {
        for (const file of additionalImageFiles) {
          const uploadData = new FormData();
          uploadData.append("image", file);
          const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
          if (!res.ok) throw new Error("Image upload failed");
          const data = await res.json();
          additionalImageUrls.push(data.imageUrl);
        }
      }

      let videoUrl = formData.videoUrl;
      // Upload video if Direct Upload is selected and a new video file is selected
      if (formData.videoType === "upload" && videoFile) {
        const uploadData = new FormData();
        uploadData.append("image", videoFile); // Multer is configured for 'image' field in upload.single('image')
        const res = await fetch("/api/admin/upload", { method: "POST", body: uploadData });
        if (!res.ok) throw new Error("Video upload failed");
        const data = await res.json();
        videoUrl = data.imageUrl;
      }

      const productData = {
        ...formData,
        image: imageUrl,
        images: additionalImageUrls,
        videoType: formData.videoType === "none" ? "" : formData.videoType,
        videoUrl: formData.videoType === "youtube" ? formData.videoUrl : videoUrl,
        price: parseFloat(formData.price as string),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice as string) : undefined,
        discount: formData.discount ? parseFloat(formData.discount as string) : undefined,
        stockQuantity: !formData.inStock ? 0 : (formData.stockQuantity ? parseInt(formData.stockQuantity as string) : 0),
        features: formData.features ? formData.features.split(",").map((s: string) => s.trim()) : [],
        // Ensure numbers are saved correctly
        rating: formData.rating ? parseFloat(formData.rating as string) : 0,
        ratingCount: formData.ratingCount ? parseInt(formData.ratingCount as string) : 0,
      };

      if (product?._id) {
        await updateProduct(product._id, productData);
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        await createProduct(productData);
        toast({ title: "Success", description: "Product created successfully" });
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to save product", variant: "destructive" });
    } finally {
      setLoading(false);
      setImageFile(null);
      setAdditionalImageFiles([]);
      setVideoFile(null);
    }
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
        {hasHalfStar && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
        {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />)}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)} ({formData.ratingCount || 0} reviews)</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        <h2 className="text-3xl font-bold">{product ? "Edit Product" : "Add Product"}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
        
        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="name">Product Name *</Label><Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="slug">Slug *</Label><Input id="slug" value={formData.slug} onChange={(e) => handleChange("slug", e.target.value)} required /></div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select 
              key={categories.length + '-' + formData.category}
              value={formData.category} 
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat.slug}>{cat.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No categories found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2"><Label htmlFor="price">Price (₹) *</Label><Input id="price" type="number" value={formData.price} onChange={(e) => handleChange("price", e.target.value)} required min="0" step="0.01" /></div>
          <div className="space-y-2"><Label htmlFor="originalPrice">Original Price (₹)</Label><Input id="originalPrice" type="number" value={formData.originalPrice} onChange={(e) => handleChange("originalPrice", e.target.value)} min="0" step="0.01" /></div>
          <div className="space-y-2"><Label htmlFor="discount">Discount (%)</Label><Input id="discount" type="number" value={formData.discount} onChange={(e) => handleChange("discount", e.target.value)} min="0" max="100" step="0.01" /></div>
          
          {/* MANUAL RATING SECTION */}
          <div className="space-y-2">
            <Label htmlFor="rating">Rating (0-5)</Label>
            <div className="space-y-2">
              <Input id="rating" type="number" value={formData.rating} onChange={(e) => handleRatingChange(e.target.value)} min="0" max="5" step="0.1" />
              {formData.rating && <div className="flex items-center gap-2 text-sm">{renderStarRating(parseFloat(formData.rating))}</div>}
            </div>
          </div>
          <div className="space-y-2"><Label htmlFor="ratingCount">Number of Ratings</Label><Input id="ratingCount" type="number" value={formData.ratingCount} onChange={(e) => handleRatingCountChange(e.target.value)} min="0" /></div>
          
          <div className="space-y-2"><Label htmlFor="stockQuantity">Stock Quantity</Label><Input id="stockQuantity" type="number" value={formData.stockQuantity} onChange={(e) => handleChange("stockQuantity", e.target.value)} disabled={!formData.inStock} className={!formData.inStock ? "opacity-50 cursor-not-allowed" : ""} min={0} /></div>
          <div className="space-y-2"><Label htmlFor="inStock">In Stock</Label><div className="flex items-center gap-2"><Switch id="inStock" checked={formData.inStock} onCheckedChange={handleInStockChange} /><span>{formData.inStock ? "Yes" : "No"}</span></div></div>
        </div>

        {/* Text Areas */}
        <div className="space-y-2"><Label htmlFor="description">Description *</Label><Textarea id="description" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} rows={4} required /></div>
        
        {/* Image Uploads */}
        <div className="space-y-2">
          <Label htmlFor="image">Main Image *</Label>
          <div className="space-y-2">
            {formData.image && <img loading="lazy" src={formData.image} alt="Preview" className="w-32 h-32 object-cover rounded border" />}
            <Input id="image" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setImageFile(file); }} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Additional Images</Label>
          <div className="space-y-2">
            {formData.images && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.images.split(",").filter(Boolean).map((url: string, idx: number) => (
                  <div key={idx} className="relative group">
                    <img loading="lazy" src={url.trim()} alt={`Existing preview ${idx + 1}`} className="w-16 h-16 object-cover rounded border" />
                    <Button type="button" variant="ghost" size="sm" className="absolute -top-1 -right-1 bg-background rounded-full p-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingImage(url.trim())}><X className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
            <Input type="file" accept="image/*" multiple onChange={(e) => { const files = Array.from(e.target.files || []); setAdditionalImageFiles(files); }} />
            {additionalImageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalImageFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img loading="lazy" src={URL.createObjectURL(file)} alt={`New preview ${idx + 1}`} className="w-16 h-16 object-cover rounded border" />
                    <Button type="button" variant="ghost" size="sm" className="absolute -top-1 -right-1 bg-background rounded-full p-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeNewImage(idx)}><X className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2"><Label htmlFor="features">Features (comma-separated)</Label><Textarea id="features" value={formData.features} onChange={(e) => handleChange("features", e.target.value)} rows={3} /></div>

        {/* Video Preview Section */}
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
          <h3 className="font-semibold text-lg text-slate-800">Video Preview (Hover Effect)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="videoType">Video Type</Label>
              <Select value={formData.videoType || "none"} onValueChange={(value) => {
                setFormData(prev => ({ ...prev, videoType: value === "none" ? "" : value, videoUrl: "" }));
                setVideoFile(null);
              }}>
                <SelectTrigger><SelectValue placeholder="Select video type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="upload">Direct Upload (Cloudinary)</SelectItem>
                  <SelectItem value="youtube">YouTube URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.videoType === "youtube" && (
              <div className="space-y-2">
                <Label htmlFor="videoUrl">YouTube Video URL</Label>
                <Input id="videoUrl" placeholder="https://www.youtube.com/watch?v=..." value={formData.videoUrl} onChange={(e) => handleChange("videoUrl", e.target.value)} required />
              </div>
            )}

            {formData.videoType === "upload" && (
              <div className="space-y-2">
                <Label htmlFor="videoFile">Upload Video File</Label>
                <div className="space-y-2">
                  {formData.videoUrl && (
                    <div className="text-sm text-slate-600 flex items-center gap-2">
                      <span className="font-medium">Current Video:</span>
                      <a href={formData.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline line-clamp-1">
                        Play Video URL
                      </a>
                    </div>
                  )}
                  <Input id="videoFile" type="file" accept="video/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setVideoFile(file); }} />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Product"}</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}