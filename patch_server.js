const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// Add imports
serverCode = serverCode.replace(
  'import { openapiSpecification } from "./src/openapi";',
  'import { openapiSpecification } from "./src/openapi";\nimport inventoryRouter from "./src/api/inventory";\nimport supplierRouter from "./src/api/suppliers";\nimport { logger, errorHandler } from "./src/middleware";'
);

// Add logger
serverCode = serverCode.replace(
  'app.use(express.json());',
  'app.use(express.json());\n  app.use(logger);'
);

// Remove old suppliers routes
serverCode = serverCode.replace(/\/\/ API Route - Get all Suppliers[\s\S]*?\/\/ API Route - Get all Customers/, '// Mount supplier router\n  app.use("/api/suppliers", supplierRouter);\n\n  // API Route - Get all Customers');

// Remove old inventory routes
serverCode = serverCode.replace(/\/\/ API Route - Get Inventory[\s\S]*?\/\/ API Route - Get Purchase Orders/, '// Mount inventory router\n  app.use("/api/inventory", inventoryRouter);\n\n  // API Route - Get Purchase Orders');

// Add error handler before Vite setup
serverCode = serverCode.replace(
  '// Vite development server setup',
  '// Global Error Handler\n  app.use(errorHandler);\n\n  // Vite development server setup'
);

fs.writeFileSync('server.ts', serverCode);
console.log("Patched server.ts");
