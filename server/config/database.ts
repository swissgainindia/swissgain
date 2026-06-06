import mongoose from 'mongoose';
import Product from '../models/Product';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swissgain-jewelry';

async function migrateSlugs() {
  try {
    // Find all products that have no slug or an empty slug
    const products = await Product.find({ 
      $or: [
        { slug: { $exists: false } }, 
        { slug: "" }, 
        { slug: null }
      ] 
    });
    
    if (products.length > 0) {
      console.log(`[Migration] Found ${products.length} products without a slug. Running migration...`);
      for (const product of products) {
        if (product.name) {
          const baseSlug = product.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
            
          let slug = baseSlug;
          let count = 1;
          // Ensure uniqueness of the generated slug
          while (await Product.findOne({ slug, _id: { $ne: product._id } })) {
            slug = `${baseSlug}-${count}`;
            count++;
          }
          
          product.slug = slug;
          await product.save();
          console.log(`[Migration] Updated product "${product.name}" with slug "${slug}"`);
        }
      }
      console.log(`[Migration] Successfully migrated all missing product slugs.`);
    }
  } catch (error) {
    console.error('[Migration] Slug migration error:', error);
  }
}

export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    await migrateSlugs();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

export default mongoose;
