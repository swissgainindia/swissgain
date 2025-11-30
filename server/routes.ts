import { type Express, Router, type Request, type Response } from "express";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User";
import Product from "./models/Product";
import Category from "./models/Category";
import Order from "./models/Order";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Multer setup
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "attached_assets/uploads/");
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
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
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  });
  router.get("/products/:id", async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // ADMIN PRODUCTS
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

  // FILE UPLOAD
  router.post("/admin/upload", authMiddleware, adminMiddleware, upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  app.use("/api", router);

  return new Promise<any>((resolve) => {
    resolve(app);
  });
}
