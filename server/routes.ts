import { type Express, Router, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary"; // Naya Cloudinary Import
import mongoose from "mongoose";
import User from "./models/User";
import Product from "./models/Product";
import Category from "./models/Category";
import Order from "./models/Order";
import Reel from "./models/Reel";
import { cities, getCitySlug } from "./utils/cities";

// Cloudinary Configuration (Yahan apni actual keys daalein ya .env use karein)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dvn3mzp6f",
  api_key: process.env.CLOUDINARY_API_KEY || "752777798775889",
  api_secret: process.env.CLOUDINARY_API_SECRET || "XkxNFPpWeWlp18STnB5QChZa0ZM"
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Multer setup - Ab memory mein save hoga, disk par nahi
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== MOCK AUTH =====
// For development: bypass auth completely
const authMiddleware = async (_req: Request, _res: Response, next: Function) => {
  // Skip token verification
  next();
};

const adminMiddleware = (_req: Request, _res: Response, next: Function) => {
  // Skip admin role check
  next();
};

// ===== REGISTER ROUTES =====
export async function registerRoutes(app: Express) {
  const router = Router();

  // User registration (optional)
  router.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: role || "customer",
      });
      await user.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Convert guest user to registered user post-purchase
  router.post("/users/convert-guest", async (req: Request, res: Response) => {
    try {
      const { orderId, password } = req.body;
      if (!orderId || !password) {
        return res.status(400).json({ message: "Order ID and password are required" });
      }

      // Find the order by orderId
      let order = null;
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId);
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: orderId });
      }

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Extract guest contact info
      const guestName = order.guestContact?.name || order.customerName;
      const guestEmail = order.guestContact?.email || order.customerEmail;

      if (!guestEmail) {
        return res.status(400).json({ message: "Order does not contain guest email" });
      }

      // Check if user already exists
      let user = await User.findOne({ email: guestEmail });
      if (user) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Create new User document
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate a unique username from email
      const emailPrefix = guestEmail.split("@")[0];
      let username = emailPrefix.replace(/[^a-zA-Z0-9]/g, "");
      let existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = `${username}${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = new User({
        username,
        email: guestEmail.toLowerCase().trim(),
        password: hashedPassword,
        role: "customer",
        status: "active"
      });
      await user.save();

      // Update Order document
      order.userId = user._id.toString();
      await order.save();

      // Generate JWT Token
      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

      res.status(200).json({
        message: "Guest converted successfully",
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role }
      });
    } catch (error: any) {
      console.error("Convert guest error:", error);
      res.status(500).json({ message: error.message || "Failed to convert guest to user" });
    }
  });

  // User login (optional)
  router.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        token,
        user: { id: user._id, username: user.username, email: user.email, role: user.role },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  // PUBLIC PRODUCT ROUTES
  router.get("/products", async (_req, res) => {
    const products = await Product.find().sort({ sortOrder: 1, createdAt: -1 });
    res.json(products);
  });
  const seoProductCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 60 * 60 * 1000; // 1 hour

  router.get("/products/slug/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const now = Date.now();

      // Check cache first (0ms latency for Googlebot)
      if (seoProductCache.has(slug)) {
        const cached = seoProductCache.get(slug)!;
        if (now - cached.timestamp < CACHE_TTL) {
          return res.json(cached.data);
        } else {
          seoProductCache.delete(slug); // Clear expired cache
        }
      }

      const product = await Product.findOne({ slug });
      if (!product) return res.status(404).json({ message: "Product not found" });

      // Save to cache
      seoProductCache.set(slug, { data: product, timestamp: now });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch product" });
    }
  });
  router.get("/products/:id", async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // ADMIN PRODUCTS
  router.put("/admin/products/reorder", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ message: "Invalid payload: products must be an array" });
      }

      const operations = products.map((item: { id: string; sortOrder: number }) => ({
        updateOne: {
          filter: { _id: mongoose.Types.ObjectId.isValid(item.id) ? new mongoose.Types.ObjectId(item.id) : item.id },
          update: { $set: { sortOrder: item.sortOrder } }
        }
      }));

      await Product.bulkWrite(operations);
      res.json({ message: "Product order updated successfully" });
    } catch (error: any) {
      console.error("Reorder products error:", error);
      res.status(500).json({ message: error.message || "Failed to reorder products" });
    }
  });

  router.post("/admin/products", authMiddleware, adminMiddleware, async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  });
  router.put("/admin/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });
  router.delete("/admin/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  });

  // CATEGORIES
  router.get("/categories", async (_req, res) => {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  });
  router.post("/admin/categories", authMiddleware, adminMiddleware, async (req, res) => {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  });
  router.put("/admin/categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  });
  router.delete("/admin/categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  });

  // ORDERS
  router.get("/admin/orders", authMiddleware, adminMiddleware, async (_req, res) => {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json(orders);
  });
  router.get("/admin/orders/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });
  router.put("/admin/orders/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });
  router.post("/orders", async (req, res) => {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  });

  // USERS
  router.get("/admin/users", authMiddleware, adminMiddleware, async (_req, res) => {
    const users = await User.find().select("-password").sort({ joinDate: -1 });
    res.json(users);
  });
  router.get("/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    const orders = await Order.find({ userId: req.params.id }).sort({ orderDate: -1 });
    res.json({ user, orders });
  });

  // STATS
  router.get("/admin/stats", authMiddleware, adminMiddleware, async (_req, res) => {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalCategories = await Category.countDocuments();

    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = await Order.countDocuments({ status: "pending" });
    const processingOrders = await Order.countDocuments({ status: "processing" });
    const deliveredOrders = await Order.countDocuments({ status: "delivered" });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOrders = await Order.countDocuments({ orderDate: { $gte: startOfMonth } });
    const monthlyRevenue = (await Order.find({ orderDate: { $gte: startOfMonth } })).reduce(
      (sum, order) => sum + order.total,
      0
    );

    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalCategories,
      totalRevenue,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      monthlyOrders,
      monthlyRevenue,
    });
  });

  // NAYA CLOUDINARY FILE UPLOAD ROUTE
  router.post("/admin/upload", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      // File ko buffer se base64 format mein convert karke Cloudinary par bhejna
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: "auto",
        folder: "swissgain_products", // Cloudinary mein is naam ka folder ban jayega
      });

      // Cloudinary se live secure URL milega jo database mein save hoga
      res.json({ imageUrl: result.secure_url });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ message: "Image upload failed" });
    }
  });

  // DYNAMIC SITEMAP XML ROUTE
  app.get("/sitemap.xml", async (req: Request, res: Response) => {
    // Standard XML escaping helper to prevent parsing errors like xmlParseEntityRef
    const escapeXml = (unsafeString: string): string => {
      if (!unsafeString) return '';
      return unsafeString.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    try {
      const baseUrl = `${req.protocol}://${req.get("host")}` || "https://swissgainindia.com";
      const products = await Product.find().sort({ updatedAt: -1 });
      const categories = await Category.find().sort({ name: 1 });

      const lastModToday = new Date().toISOString().split("T")[0];

      // Standard static pages
      const staticPages = [
        { loc: "/", changefreq: "daily", priority: "1.0" },
        { loc: "/products", changefreq: "daily", priority: "0.9" },
        { loc: "/affiliate", changefreq: "weekly", priority: "0.7" },
        { loc: "/refer-earn", changefreq: "weekly", priority: "0.7" },
        { loc: "/contact", changefreq: "monthly", priority: "0.5" },
        { loc: "/privacy-policy", changefreq: "monthly", priority: "0.5" },
        { loc: "/termsandconditions", changefreq: "monthly", priority: "0.5" },
        { loc: "/refundandcancellation", changefreq: "monthly", priority: "0.5" },
      ];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // 1. Add static pages
      staticPages.forEach((page) => {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(`${baseUrl}${page.loc}`)}</loc>\n`;
        xml += `    <lastmod>${lastModToday}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
      });

      // 2. Add category pages
      categories.forEach((category) => {
        const catLastMod = (category as any).updatedAt
          ? new Date((category as any).updatedAt).toISOString().split("T")[0]
          : lastModToday;
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(`${baseUrl}/products?category=${category.slug}`)}</loc>\n`;
        xml += `    <lastmod>${catLastMod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });

      // 3. Add dynamic product pages
      products.forEach((product) => {
        const prodLastMod = (product as any).updatedAt
          ? new Date((product as any).updatedAt).toISOString().split("T")[0]
          : lastModToday;
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(`${baseUrl}/product/${product._id}`)}</loc>\n`;
        xml += `    <lastmod>${prodLastMod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });

      // 4. Add programmatic SEO landing pages (Product x City)
      products.forEach((product) => {
        const prodLastMod = (product as any).updatedAt
          ? new Date((product as any).updatedAt).toISOString().split("T")[0]
          : lastModToday;
        
        cities.forEach((city) => {
          const citySlug = getCitySlug(city);
          xml += `  <url>\n`;
          xml += `    <loc>${escapeXml(`${baseUrl}/buy/${product.slug}-in-${citySlug}`)}</loc>\n`;
          xml += `    <lastmod>${prodLastMod}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.7</priority>\n`;
          xml += `  </url>\n`;
        });
      });

      xml += `</urlset>`;

      res.header("Content-Type", "application/xml");
      res.status(200).send(xml);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // ===== SHOPPABLE REELS =====
  router.get("/reels", async (_req, res) => {
    try {
      const reels = await Reel.find({ status: "approved" })
        .populate("productId")
        .populate({ path: "userId", select: "username email role" })
        .sort({ createdAt: -1 });
      res.json(reels);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  router.get("/admin/reels", authMiddleware, adminMiddleware, async (_req, res) => {
    try {
      const reels = await Reel.find()
        .populate("productId")
        .populate({ path: "userId", select: "username email role" })
        .sort({ createdAt: -1 });
      res.json(reels);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  router.post("/reels", async (req, res) => {
    try {
      const { videoUrl, productId, userId, isAdmin } = req.body;
      
      // Seed random views and likes for affiliates/users to show instantly on dashboard
      const views = Math.floor(Math.random() * 401) + 100; // 100 to 500 views
      const likes = Math.floor(Math.random() * 71) + 10;   // 10 to 80 likes

      const reel = new Reel({
        videoUrl,
        productId,
        userId: userId || null,
        status: isAdmin ? "approved" : "pending",
        views,
        likes
      });
      await reel.save();
      res.status(201).json(reel);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  router.put("/admin/reels/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { status, productId } = req.body;
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (productId !== undefined) updateData.productId = productId;

      const reel = await Reel.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate("productId").populate({ path: "userId", select: "username email role" });
      
      if (!reel) return res.status(404).json({ message: "Reel not found" });
      res.json(reel);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  router.delete("/reels/:id", async (req, res) => {
    try {
      const { userId } = req.body;
      const reel = await Reel.findById(req.params.id);
      if (!reel) return res.status(404).json({ message: "Reel not found" });
      
      // If the reel has an associated userId, verify ownership
      if (reel.userId && reel.userId.toString() !== userId) {
        return res.status(403).json({ message: "You are not authorized to delete this reel" });
      }
      
      await Reel.findByIdAndDelete(req.params.id);
      res.json({ message: "Reel deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  router.delete("/admin/reels/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const reel = await Reel.findByIdAndDelete(req.params.id);
      if (!reel) return res.status(404).json({ message: "Reel not found" });
      res.json({ message: "Reel deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ===== DIGITAL WARRANTY =====
  router.get("/warranty/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      let order = null;
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId);
      }
      if (!order) {
        order = await Order.findOne({ orderNumber: orderId });
      }
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (!order.items || order.items.length === 0) {
        return res.status(400).json({ message: "Order contains no products" });
      }
      
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.use("/api", router);

  return new Promise<any>((resolve) => {
    resolve(app);
  });
}
