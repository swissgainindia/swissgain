import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  image: string;
  images: string[];
  features?: string[];
  inStock: boolean;
  stockQuantity?: number;
  rating?: number;
  ratingCount?: number; // ✅ Changed from 'reviews' to 'ratingCount'
  sales?: number;
  videoType?: 'upload' | 'youtube' | '';
  videoUrl?: string;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: Number },
  category: { type: String, required: true },
  image: { type: String, required: true },
  images: { type: [String], default: [] },
  features: { type: [String], default: [] },
  inStock: { type: Boolean, default: true },
  stockQuantity: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }, // ✅ Changed from 'reviews' to 'ratingCount'
  sales: { type: Number, default: 0 },
  videoType: { type: String, enum: ['upload', 'youtube', ''], default: '' },
  videoUrl: { type: String, default: '' }
}, { timestamps: true });

// Check if model exists before compiling to prevent overwrite errors in dev
export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);