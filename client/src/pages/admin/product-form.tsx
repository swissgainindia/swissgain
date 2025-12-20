import { useEffect, useState } from "react";
import { createProduct, updateProduct } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X } from "lucide-react";
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
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price || "",
    originalPrice: product?.originalPrice || "",
    discount: product?.discount || "",
    category: product?.category || "",
    image: product?.image || "",
    images: product?.images?.join(", ") || "",
    features: product?.features?.join(", ") || "",
    inStock: product?.inStock !== undefined ? product.inStock : true,
    stockQuantity: product?.stockQuantity || "",
  });

  // ✅ Fetch categories from MongoDB
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

  // Handle inStock switch change
  const handleInStockChange = (checked: boolean) => {
    setFormData(prev => {
      const newData = { ...prev, inStock: checked };
      if (!checked) {
        // If turning off, set stockQuantity to 0 and disable
        newData.stockQuantity = "0";
      }
      return newData;
    });
  };

  // ✅ Handle field changes
  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Remove existing image
  const removeExistingImage = (urlToRemove: string) => {
    const existing = formData.images ? formData.images.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const updated = existing.filter((url: string) => url !== urlToRemove);
    setFormData(prev => ({ ...prev, images: updated.join(", ") }));
  };

  // Remove new additional image file
  const removeNewImage = (indexToRemove: number) => {
    const updated = additionalImageFiles.filter((_, idx) => idx !== indexToRemove);
    setAdditionalImageFiles(updated);
  };

  // ✅ Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = formData.image;
      // Upload main image if new one selected
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadData,
        });
        if (!res.ok) throw new Error("Image upload failed");
        const data = await res.json();
        imageUrl = data.imageUrl;
      }

      // Handle additional images: upload new files and append to existing
      const existingImages = formData.images ? formData.images.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      let additionalImageUrls: string[] = [...existingImages];
      if (additionalImageFiles.length > 0) {
        for (const file of additionalImageFiles) {
          const uploadData = new FormData();
          uploadData.append("image", file);
          const res = await fetch("/api/admin/upload", {
            method: "POST",
            body: uploadData,
          });
          if (!res.ok) throw new Error("Image upload failed");
          const data = await res.json();
          additionalImageUrls.push(data.imageUrl);
        }
      }

      const productData = {
        ...formData,
        image: imageUrl,
        images: additionalImageUrls,
        price: parseFloat(formData.price as string),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice as string) : undefined,
        discount: formData.discount ? parseFloat(formData.discount as string) : undefined,
        stockQuantity: !formData.inStock ? 0 : (formData.stockQuantity ? parseInt(formData.stockQuantity as string) : 0),
        features: formData.features ? formData.features.split(",").map((s: string) => s.trim()) : [],
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
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Clear file states after submit
      setImageFile(null);
      setAdditionalImageFiles([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h2 className="text-3xl font-bold">
          {product ? "Edit Product" : "Add Product"}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              required
            />
          </div>
          {/* ✅ Dynamic Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-400">No categories found</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹) *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="originalPrice">Original Price (₹)</Label>
            <Input
              id="originalPrice"
              type="number"
              value={formData.originalPrice}
              onChange={(e) => handleChange("originalPrice", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              value={formData.discount}
              onChange={(e) => handleChange("discount", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stockQuantity">Stock Quantity</Label>
            <Input
              id="stockQuantity"
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => handleChange("stockQuantity", e.target.value)}
              disabled={!formData.inStock}
              className={!formData.inStock ? "opacity-50 cursor-not-allowed" : ""}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inStock">In Stock</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="inStock"
                checked={formData.inStock}
                onCheckedChange={handleInStockChange}
              />
              <span>{formData.inStock ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={4}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Main Image *</Label>
          <div className="space-y-2">
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="w-32 h-32 object-cover rounded border"
              />
            )}
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setImageFile(file);
              }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Additional Images</Label>
          <div className="space-y-2">
            {/* Preview existing images */}
            {formData.images && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.images.split(",").filter(Boolean).map((url: string, idx: number) => {
                  const trimmedUrl = url.trim();
                  return (
                    <div key={idx} className="relative group">
                      <img
                        src={trimmedUrl}
                        alt={`Existing preview ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute -top-1 -right-1 bg-background rounded-full p-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeExistingImage(trimmedUrl)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* File input for new additional images */}
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAdditionalImageFiles(files);
              }}
            />
            {/* Preview new selected files */}
            {additionalImageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalImageFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New preview ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute -top-1 -right-1 bg-background rounded-full p-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeNewImage(idx)}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500">Select files to add new images (existing images will be preserved)</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="features">Features (comma-separated)</Label>
          <Textarea
            id="features"
            value={formData.features}
            onChange={(e) => handleChange("features", e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Product"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}