import mongoose from 'mongoose';
import Product from './server/models/Product';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swissgain-jewelry';

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB');
    
    const count = await Product.countDocuments();
    console.log(`Total products in database: ${count}`);
    
    const products = await Product.find({}, 'name category price');
    products.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name} (${p.category}) - ₹${p.price}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

check();
