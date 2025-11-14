import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./seed";
import { taskReminderService } from "./task-reminders";
import { meetingReminderService } from "./meeting-reminders";
import { todoReminderService } from "./todo-reminders";

const app = express();

// CORS configuration for cross-device compatibility
app.use(cors({
  origin: true, // Allow all origins for internal team app
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400 // Cache preflight requests for 24 hours
}));

// Cache-control headers for better cross-device performance
app.use((req, res, next) => {
  // Don't cache API responses or authentication endpoints
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));

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

(async () => {
  const server = await registerRoutes(app);

  // Add health check endpoint for deployment verification
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // importantly only setup vite in development and after
    // the server is listening so HMR can read the correct port
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Defer expensive startup operations to after server is ready
    // This ensures health checks pass quickly during deployment
    setTimeout(() => {
      // Initialize database with admin user if empty (non-blocking)
      initializeDatabase()
        .then(() => log('Database initialized'))
        .catch((err) => log(`Database initialization error: ${err.message}`));
      
      // Start task reminder service (checks every 60 minutes) (non-blocking)
      taskReminderService.start(60)
        .then(() => log('Task reminder service started'))
        .catch((err) => log(`Task reminder service error: ${err.message}`));
      
      // Start meeting reminder service (checks every 1 minute) (non-blocking)
      meetingReminderService.start(1)
        .then(() => log('Meeting reminder service started'))
        .catch((err) => log(`Meeting reminder service error: ${err.message}`));
      
      // Start todo reminder service (checks every 60 minutes) (non-blocking)
      todoReminderService.start(60)
        .then(() => log('Todo reminder service started'))
        .catch((err) => log(`Todo reminder service error: ${err.message}`));
    }, 2000); // Delay background services by 2 seconds to allow health checks to pass
  });
})();
