import mongoose, { Schema, Document } from 'mongoose';

export interface IReel extends Document {
  videoUrl: string;
  productId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReelSchema: Schema = new Schema({
  videoUrl: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 }
}, { timestamps: true });

// Check if model exists before compiling to prevent overwrite errors in development
export default mongoose.models.Reel || mongoose.model<IReel>('Reel', ReelSchema);
