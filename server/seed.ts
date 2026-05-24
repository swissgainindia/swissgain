import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User";
import Category from "./models/Category";
import Product from "./models/Product";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/swissgain-jewelry";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log("Cleared existing data");

    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      username: "admin",
      email: "admin@swissgain.com",
      password: hashedPassword,
      role: "admin",
    });
    console.log("Created admin user: admin@swissgain.com / admin123");

    const categories = await Category.insertMany([
      { name: "Necklaces", slug: "necklaces", description: "Beautiful necklaces for every occasion" },
      { name: "Earrings", slug: "earrings", description: "Elegant earrings to complement your style" },
      { name: "Rings", slug: "rings", description: "Stunning rings for special moments" },
      { name: "Bracelets", slug: "bracelets", description: "Stylish bracelets for everyday wear" },
      { name: "Bangles", slug: "bangles", description: "Traditional and modern bangles" },
      { name: "Chains", slug: "chains", description: "Premium gold chains" },
      { name: "Bridal Sets", slug: "bridal-sets", description: "Complete bridal jewelry sets" },
      { name: "Wedding Sets", slug: "wedding-sets", description: "Exclusive wedding jewelry collections" },
    ]);
    console.log("Created categories");

    await Product.insertMany([
      {
        name: "Swiss Premium Gold Necklace",
        slug: "swiss-premium-gold-necklace",
        description: "Exquisite Swiss-crafted necklace featuring premium gold and timeless design.",
        price: 2999,
        originalPrice: 3999,
        discount: 25,
        category: "necklaces",
        image: "/images/products/necklace/Diamond  Gemstone Necklace.jpg",
        images: ["/images/products/necklace/Diamond  Gemstone Necklace.jpg"],
        features: ["24K Gold plated", "Hypoallergenic", "Adjustable length", "Lifetime warranty"],
        inStock: true,
        stockQuantity: 50,
        rating: 4.9,
        reviews: 127,
      },
      {
        name: "Diamond Pendant Necklace",
        slug: "diamond-pendant-necklace",
        description: "Stunning diamond pendant necklace with brilliant cut diamonds.",
        price: 4599,
        originalPrice: 5999,
        discount: 23,
        category: "necklaces",
        image: "/images/products/necklace/Kundan  Polki Necklace.jpg",
        images: ["/images/products/necklace/Kundan  Polki Necklace.jpg"],
        features: ["0.5 carat diamond", "18K white gold", "Certified diamonds", "Gift box included"],
        inStock: true,
        stockQuantity: 30,
        rating: 4.8,
        reviews: 89,
      },
      {
        name: "Traditional Gold Bangles",
        slug: "traditional-gold-bangles",
        description: "Beautiful traditional gold bangles with intricate designs.",
        price: 1999,
        originalPrice: 2499,
        discount: 20,
        category: "bangles",
        image: "/images/products/bangles/Traditional Gold Bangles.jpg",
        images: ["/images/products/bangles/Traditional Gold Bangles.jpg"],
        features: ["22K Gold plated", "Traditional design", "Set of 2", "Adjustable size"],
        inStock: true,
        stockQuantity: 75,
        rating: 4.7,
        reviews: 156,
      },
    ]);
    console.log("Created sample products");

    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
