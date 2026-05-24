import type { VercelRequest, VercelResponse } from "@vercel/node";
import connectDB from "./../lib/mongodb";
import Product from "../server/models/Product";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    await connectDB();

    if (req.method === "GET") {
      const products = await Product.find().sort({ createdAt: -1 });
      return res.status(200).json(products);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /products error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
