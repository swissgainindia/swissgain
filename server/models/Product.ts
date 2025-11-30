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
  reviews?: number;
  sales?: number;
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
  reviews: { type: Number, default: 0 },
  sales: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
