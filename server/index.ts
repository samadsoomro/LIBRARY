import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { createServer } from "http";
import path from "path";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { storage } from "./storage.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
    isLibraryCard?: boolean;
  }
}

const app = express();
app.use(express.json({ limit: '1024mb' }));
app.use(express.urlencoded({ extended: false, limit: '1024mb' }));

import MemoryStoreFactory from "memorystore";
const MemoryStore = MemoryStoreFactory(session);

app.use(
  session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "gcmn-library-secret-2024",
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Serve static files from the uploads directory
const uploadDir = path.join(process.cwd(), "server", "uploads");
app.use("/server/uploads", express.static(uploadDir));

// Register routes synchronously
registerRoutes(app);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  // Don't throw error here to avoid crashing in serverless environment
  console.error(err);
});

const server = createServer(app);
server.timeout = 600000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

if (process.env.NODE_ENV === "development" || process.env.VITE_DEV === "true") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

// Only start server if not running as a Vercel function
if (process.env.VERCEL !== "1") {
  const port = process.env.PORT || 5000;
  server.listen(
    {
      port: Number(port),
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
}

export default app;
