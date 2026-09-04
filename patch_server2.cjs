const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// Imports
serverCode = serverCode.replace(
  'import { openapiSpecification } from "./src/openapi";',
  `import { openapiSpecification } from "./src/openapi";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRouter from "./src/api/auth";
import { requireAuth, requireRole } from "./src/middleware";`
);

// Add security middlewares
const securityMiddlewares = `
  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false // disable CSP in dev if it breaks Vite
  }));
  app.use(cors());
  
  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
  });
  app.use("/api/", apiLimiter);
`;

serverCode = serverCode.replace(
  '  app.use(logger);',
  '  app.use(logger);\n' + securityMiddlewares
);

// Replace Auth routes
serverCode = serverCode.replace(
  /\/\/ API Route - Auth Register[\s\S]*?\/\/ Mount supplier router/,
  `// Auth Routes
  app.use("/api/auth", authRouter);

  // Secure API routes with requireAuth
  // Mount supplier router`
);

// Secure other routes
serverCode = serverCode.replace(
  'app.use("/api/suppliers", supplierRouter);',
  'app.use("/api/suppliers", requireAuth, supplierRouter);'
);

serverCode = serverCode.replace(
  'app.use("/api/inventory", inventoryRouter);',
  'app.use("/api/inventory", requireAuth, inventoryRouter);'
);

// Adding requireAuth to the remaining inline routes
serverCode = serverCode.replace(/app\.get\("\/api\/customers",/g, 'app.get("/api/customers", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/customers",/g, 'app.post("/api/customers", requireAuth,');
serverCode = serverCode.replace(/app\.get\("\/api\/warehouses",/g, 'app.get("/api/warehouses", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/warehouses",/g, 'app.post("/api/warehouses", requireAuth, requireRole(["Admin", "Warehouse Manager"]),');

serverCode = serverCode.replace(/app\.get\("\/api\/purchase-orders",/g, 'app.get("/api/purchase-orders", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/purchase-orders",/g, 'app.post("/api/purchase-orders", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/purchase-orders\/:id\/receive",/g, 'app.post("/api/purchase-orders/:id/receive", requireAuth,');

serverCode = serverCode.replace(/app\.post\("\/api\/orders\/:id\/pay",/g, 'app.post("/api/orders/:id/pay", requireAuth,');

serverCode = serverCode.replace(/app\.get\("\/api\/sales-orders",/g, 'app.get("/api/sales-orders", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/sales-orders",/g, 'app.post("/api/sales-orders", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/sales-orders\/:id\/dispatch",/g, 'app.post("/api/sales-orders/:id/dispatch", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/sales-orders\/:id\/complete",/g, 'app.post("/api/sales-orders/:id/complete", requireAuth,');

serverCode = serverCode.replace(/app\.get\("\/api\/shipments",/g, 'app.get("/api/shipments", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/shipments\/:id\/telemetry",/g, 'app.post("/api/shipments/:id/telemetry", requireAuth,');

serverCode = serverCode.replace(/app\.get\("\/api\/blockchain",/g, 'app.get("/api/blockchain", requireAuth,');
serverCode = serverCode.replace(/app\.get\("\/api\/blockchain\/entity\/:entityId",/g, 'app.get("/api/blockchain/entity/:entityId", requireAuth,');
serverCode = serverCode.replace(/app\.get\("\/api\/blockchain\/verify",/g, 'app.get("/api/blockchain/verify", requireAuth,');

serverCode = serverCode.replace(/app\.get\("\/api\/ai\/predict-shortages",/g, 'app.get("/api/ai/predict-shortages", requireAuth,');
serverCode = serverCode.replace(/app\.post\("\/api\/ai\/chat",/g, 'app.post("/api/ai/chat", requireAuth,');

fs.writeFileSync('server.ts', serverCode);
console.log("Patched server.ts with Security features");
