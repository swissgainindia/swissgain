import express, { type Request, Response, NextFunction, Express } from "express";
import { createServer } from "http";
import path from "path";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectDatabase } from "./config/database";

const app: Express = express();
const server = createServer(app);

/* ------------------------------------
   Global Middleware
------------------------------------ */

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ------------------------------------
   API Request Logger
------------------------------------ */

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  let capturedJsonResponse: any;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    if (reqPath.startsWith("/api")) {
      const duration = Date.now() - start;
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine.length > 120 ? logLine.slice(0, 120) + "…" : logLine);
    }
  });

  next();
});

/* ------------------------------------
   Bootstrap Application
------------------------------------ */

(async () => {
  try {
    /* -------- MongoDB -------- */
    await connectDatabase();
    log("✅ MongoDB connected");

    /* -------- Static Uploads -------- */
    app.use(
      "/uploads",
      express.static(path.resolve("attached_assets/uploads"))
    );

    /* -------- API Routes -------- */
    await registerRoutes(app);

    /* -------- Error Handler -------- */
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    /* -------- Vite / Production -------- */
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("⚡ Vite dev middleware enabled");
    } else {
      serveStatic(app);
      log("📦 Serving production build");
    }

    /* -------- Start Server -------- */
    const port = Number(process.env.PORT) || 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`🚀 Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
})();
