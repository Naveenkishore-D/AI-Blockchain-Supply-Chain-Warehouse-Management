import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { 
  loadDB, 
  saveDB, 
  addBlockchainBlock, 
  calculateBlockHash, 
  generateBlockSignature 
} from "./server-db";
import { Supplier, Customer, Warehouse, InventoryItem, PurchaseOrder, SalesOrder, Shipment } from "./src/types";
import { openapiSpecification } from "./src/openapi";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRouter from "./src/api/auth";
import { requireAuth, requireRole } from "./src/middleware";
import inventoryRouter from "./src/api/inventory";
import supplierRouter from "./src/api/suppliers";
import { logger, errorHandler } from "./src/middleware";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in your secrets/environment variables. Please configure it in Settings > Secrets to enable the AI features.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export const app = express();
app.set("trust proxy", 1);
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false // disable CSP in dev if it breaks Vite
}));
app.use(cors());
  
  // Rate Limiting - Disabled for debugging Failed to fetch
  /*
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
    validate: { xForwardedForHeader: false, trustProxy: false, default: false }
  });
  app.use("/api/", apiLimiter);
  */


  // API Route - OpenAPI JSON spec
  app.get(["/api/openapi.json", "/openapi.json"], (req, res) => {
    res.json(openapiSpecification);
  });

  // API Health Check
  app.get(["/api/health", "/health"], (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Route - Ethereum Web3 Status (Mock)
  app.get(["/api/blockchain/ethereum-status", "/blockchain/ethereum-status"], (req, res) => {
    res.json({
        connected: true,
        network: "Local Simulated Ethereum Ledger (Ganache Offline)",
        contractAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678"
    });
  });

  // API Route - Swagger UI
  app.get("/api-docs", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus Supply Chain API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #0b0f19; font-family: sans-serif; }
    
    /* Elegant Dark Theme Overrides for Swagger UI */
    .swagger-ui {
      background-color: #0b0f19;
      color: #e2e8f0;
      padding: 1rem 0;
    }
    .swagger-ui .info {
      margin: 30px 0;
      background: #111827;
      border: 1px solid #1f2937;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .swagger-ui .info .title, .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3, .swagger-ui .info h4, .swagger-ui .info h5 {
      color: #f8fafc !important;
    }
    .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info div, .swagger-ui .info td {
      color: #94a3b8 !important;
    }
    .swagger-ui .info a {
      color: #10b981 !important;
    }
    .swagger-ui .scheme-container {
      background-color: #111827;
      border-top: 1px solid #1f2937;
      border-bottom: 1px solid #1f2937;
      box-shadow: none;
      padding: 20px 0;
    }
    .swagger-ui .opblock {
      background: #111827 !important;
      border-radius: 8px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .swagger-ui .opblock .opblock-summary-operation-id, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-path__deprecated {
      color: #f1f5f9 !important;
    }
    .swagger-ui .opblock .opblock-summary-description {
      color: #94a3b8 !important;
    }
    .swagger-ui .opblock-tag {
      color: #f1f5f9 !important;
      border-bottom: 1px solid #1f2937 !important;
    }
    .swagger-ui section.models {
      border: 1px solid #1f2937 !important;
      border-radius: 12px !important;
      background: #111827 !important;
    }
    .swagger-ui section.models h4 {
      color: #f1f5f9 !important;
      border-bottom: 1px solid #1f2937 !important;
    }
    .swagger-ui section.models .model-container {
      background: #0f172a !important;
      border-radius: 8px !important;
      margin: 10px !important;
    }
    .swagger-ui .model-title {
      color: #34d399 !important;
    }
    .swagger-ui .model {
      color: #94a3b8 !important;
    }
    .swagger-ui .prop-name {
      color: #38bdf8 !important;
    }
    .swagger-ui .prop-type {
      color: #10b981 !important;
    }
    .swagger-ui .tabli button {
      color: #e2e8f0 !important;
    }
    .swagger-ui .response-col_status {
      color: #38bdf8 !important;
    }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th {
      color: #f1f5f9 !important;
      border-bottom: 1px solid #1f2937 !important;
    }
    .swagger-ui .parameter__name {
      color: #f1f5f9 !important;
    }
    .swagger-ui .parameter__type {
      color: #10b981 !important;
    }
    .swagger-ui select {
      background: #1f2937 !important;
      color: #f1f5f9 !important;
      border: 1px solid #374151 !important;
    }
    .swagger-ui input[type=text] {
      background: #1f2937 !important;
      color: #f1f5f9 !important;
      border: 1px solid #374151 !important;
    }
    .swagger-ui .btn {
      background: #10b981 !important;
      color: #060814 !important;
      border: none !important;
      border-radius: 6px !important;
      font-weight: bold;
    }
    .swagger-ui .btn:hover {
      background: #34d399 !important;
    }
    .swagger-ui .btn.authorize {
      background: transparent !important;
      color: #10b981 !important;
      border: 1px solid #10b981 !important;
    }
    .swagger-ui .btn.authorize svg {
      fill: #10b981 !important;
    }
    .swagger-ui .btn.execute {
      background: #10b981 !important;
      color: #060814 !important;
    }
    .swagger-ui .btn.cancel {
      background: #ef4444 !important;
      color: white !important;
    }
    .swagger-ui .opblock-body pre.microlight {
      background: #0f172a !important;
      border: 1px solid #1f2937 !important;
      color: #f1f5f9 !important;
    }
    .swagger-ui .dialog-ux .modal-ux {
      background: #111827 !important;
      border: 1px solid #1f2937 !important;
    }
    .swagger-ui .dialog-ux .modal-ux-header h3 {
      color: #f1f5f9 !important;
    }
    .swagger-ui .dialog-ux .modal-ux-content {
      color: #94a3b8 !important;
    }
    .swagger-ui .topbar { display: none !important; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`);
  });

  // Auth Routes (supports both /api/auth and /auth for Vercel serverless path compatibility)
  app.use(["/api/auth", "/auth"], authRouter);

  // Secure API routes with requireAuth
  // Mount supplier router
  app.use(["/api/suppliers", "/suppliers"], requireAuth, supplierRouter);

  // API Route - Get all Customers
  app.get("/api/customers", requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.customers || []);
  });

  // API Route - Add Customer
  app.post("/api/customers", requireAuth, (req, res) => {
    const db = loadDB();
    const { name, contactName, email, phone, location } = req.body;
    
    if (!name || !contactName || !email || !location) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const newCustomer: Customer = {
      id: 'cust-' + Math.random().toString(36).substring(2, 9),
      name,
      contactName,
      email,
      phone: phone || '',
      location,
      status: 'Active',
      totalOrdersCount: 0
    };

    if (!db.customers) {
      db.customers = [];
    }
    db.customers.push(newCustomer);
    
    // Write audit trail to blockchain
    addBlockchainBlock(
      db,
      'CUSTOMER_REGISTERED',
      newCustomer.id,
      'Customer',
      `Customer '${name}' was registered at ${location} by manager.`,
      'OPERATOR_ADMIN',
      `${name} ${location} ${email}`
    );

    saveDB(db);
    res.status(201).json(newCustomer);
  });

  // API Route - Get Warehouses
  app.get("/api/warehouses", requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.warehouses);
  });

  // API Route - Add Warehouse
  app.post("/api/warehouses", requireAuth, requireRole(["Admin", "Warehouse Manager"]), (req, res) => {
    const db = loadDB();
    const { name, location, capacity, managerName, city, state, country, pincode } = req.body;

    if (!name || !location || !capacity || !managerName) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const newWarehouse: Warehouse = {
      id: 'wh-' + Math.random().toString(36).substring(2, 9),
      name,
      location,
      city,
      state,
      country,
      pincode,
      capacity: Number(capacity),
      usedCapacity: 0,
      managerName,
      status: 'Active'
    };

    db.warehouses.push(newWarehouse);
    saveDB(db);
    res.status(201).json(newWarehouse);
  });

  // Mount inventory router
  app.use(["/api/inventory", "/inventory"], requireAuth, inventoryRouter);

  // API Route - Get Purchase Orders
  app.get("/api/purchase-orders", requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.purchaseOrders);
  });

  // API Route - Create Purchase Order
  app.post("/api/purchase-orders", requireAuth, (req, res) => {
    const db = loadDB();
    const { supplierId, items } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Invalid purchase order request payload." });
      return;
    }

    const supplier = db.suppliers.find(s => s.id === supplierId);
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    // items should be [{itemId, quantity}]
    const processedItems = items.map(pItem => {
      const invItem = db.inventory.find(i => i.id === pItem.itemId);
      if (!invItem) {
        throw new Error(`Inventory item ${pItem.itemId} not found`);
      }
      return {
        itemId: invItem.id,
        name: invItem.name,
        quantity: Number(pItem.quantity),
        price: invItem.unitPrice
      };
    });

    const totalAmount = processedItems.reduce((acc, current) => acc + (current.quantity * current.price), 0);
    const poNumber = 'PO-2026-' + Math.floor(100 + Math.random() * 900);

    const newPO: PurchaseOrder = {
      id: 'po-' + Math.random().toString(36).substring(2, 9),
      poNumber,
      supplierId,
      supplierName: supplier.name,
      items: processedItems,
      totalAmount,
      status: 'Sent',
      paymentStatus: 'Pending',
      invoiceId: 'INV-' + Math.floor(1000 + Math.random() * 9000),
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    db.purchaseOrders.push(newPO);

    // Create a pending shipment automatically for incoming cargo
    const newShipmentId = 'ship-' + Math.random().toString(36).substring(2, 9);
    const shipmentNumber = 'SH-2026-' + Math.floor(100 + Math.random() * 900);
    const targetWHId = processedItems.length > 0 ? (db.inventory.find(i => i.id === processedItems[0].itemId)?.warehouseId || 'wh-1') : 'wh-1';
    const targetWH = db.warehouses.find(w => w.id === targetWHId);

    const newShipment: Shipment = {
      id: newShipmentId,
      shipmentNumber,
      orderId: newPO.id,
      orderNumber: newPO.poNumber,
      orderType: 'Purchase',
      origin: supplier.location,
      destination: `${targetWH?.name || 'Central Storage Hub'} (${targetWH?.location || 'IL'})`,
      carrier: 'Apex Cargo Express',
      trackingNumber: 'TRK-APX-' + Math.floor(100000 + Math.random() * 900000),
      status: 'In Transit',
      currentTemp: 18.0,
      currentHumidity: 45.0,
      currentGForce: 1.0,
      sensorHistory: [
        { timestamp: new Date().toISOString(), temp: 18.0, humidity: 45.0, gForce: 1.0 }
      ],
      updatedAt: new Date().toISOString()
    };

    db.shipments.push(newShipment);

    // Blockchain block log PO Sent and Shipment Launched
    addBlockchainBlock(
      db,
      'PURCHASE_ORDER_SENT',
      newPO.id,
      'Order',
      `Purchase Order '${poNumber}' sent to '${supplier.name}' for total values of $${totalAmount}.`,
      'PURCHASING_MANAGER',
      `${poNumber} ${supplier.name} $${totalAmount}`
    );

    addBlockchainBlock(
      db,
      'SHIPMENT_LAUNCHED',
      newShipment.id,
      'Shipment',
      `Shipment '${shipmentNumber}' generated automatically for order '${poNumber}'. In Transit with sensor logs.`,
      'SYSTEM_ROUTING',
      `${shipmentNumber} Order:${poNumber} Origin:${supplier.location}`
    );

    saveDB(db);
    res.status(201).json(newPO);
  });

  // API Route - Mark PO Received (Simulate delivery, update inventory levels)
  app.post("/api/purchase-orders/:id/receive", requireAuth, (req, res) => {
    const db = loadDB();
    const poId = req.params.id;
    const po = db.purchaseOrders.find(p => p.id === poId);

    if (!po) {
      res.status(404).json({ error: "Purchase Order not found" });
      return;
    }

    if (po.status === 'Received') {
      res.status(400).json({ error: "Purchase Order already received" });
      return;
    }

    po.status = 'Received';

    // Increment inventory item quantities and update warehouse capacity
    po.items.forEach(orderItem => {
      const invItem = db.inventory.find(i => i.id === orderItem.itemId);
      if (invItem) {
        invItem.quantity += orderItem.quantity;
        const wh = db.warehouses.find(w => w.id === invItem.warehouseId);
        if (wh) {
          wh.usedCapacity += orderItem.quantity;
        }

        addBlockchainBlock(
          db,
          'INVENTORY_RECEIVED',
          invItem.id,
          'Inventory',
          `Inventory '${invItem.name}' count increased by +${orderItem.quantity} units following reception of PO '${po.poNumber}'.`,
          'WAREHOUSE_OPERATOR',
          `${invItem.sku} +${orderItem.quantity}`
        );
      }
    });

    // Update associated shipment status to 'Delivered'
    const shipment = db.shipments.find(s => s.orderId === po.id);
    if (shipment) {
      shipment.status = 'Delivered';
      shipment.updatedAt = new Date().toISOString();
      addBlockchainBlock(
        db,
        'SHIPMENT_DELIVERED',
        shipment.id,
        'Shipment',
        `Shipment '${shipment.shipmentNumber}' marked as Delivered successfully. Cold chain telemetry closed.`,
        'LOGISTICS_OPERATOR',
        `${shipment.shipmentNumber} Status:Delivered`
      );
    }

    addBlockchainBlock(
      db,
      'PURCHASE_ORDER_RECEIVED',
      po.id,
      'Order',
      `Purchase Order '${po.poNumber}' marked as fully Received and processed.`,
      'WAREHOUSE_MANAGER',
      `${po.poNumber} Status:Received`
    );

    saveDB(db);
    res.json(po);
  });

  // API Route - Mark Order Paid
  app.post("/api/orders/:id/pay", requireAuth, (req, res) => {
    const db = loadDB();
    const orderId = req.params.id;
    
    let order: any = db.purchaseOrders.find((p: any) => p.id === orderId);
    if (!order) {
        order = db.salesOrders.find((s: any) => s.id === orderId);
    }
    
    if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
    }
    
    if (order.paymentStatus === 'Paid') {
        res.status(400).json({ error: "Order already paid" });
        return;
    }
    
    order.paymentStatus = 'Paid';
    
    addBlockchainBlock(
        db,
        'ORDER_PAYMENT_COMPLETED',
        order.id,
        'Order',
        `Payment completed for order ${order.poNumber || order.soNumber}. Invoice ${order.invoiceId} settled.`,
        'FINANCE_OPERATOR',
        `$${order.totalAmount}`
    );
    
    saveDB(db);
    res.json(order);
  });
  
  // API Route - Get Sales Orders
  app.get("/api/sales-orders", requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.salesOrders);
  });

  // API Route - Create Sales Order
  app.post("/api/sales-orders", requireAuth, (req, res) => {
    const db = loadDB();
    const { customerName, items } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Invalid sales order details" });
      return;
    }

    // items: [{itemId, quantity}]
    try {
      const processedItems = items.map(sItem => {
        const invItem = db.inventory.find(i => i.id === sItem.itemId);
        if (!invItem) {
          throw new Error(`Inventory item ${sItem.itemId} not found`);
        }
        if (invItem.quantity < sItem.quantity) {
          throw new Error(`Insufficient stock for '${invItem.name}'. Available: ${invItem.quantity}, Requested: ${sItem.quantity}`);
        }
        return {
          itemId: invItem.id,
          name: invItem.name,
          quantity: Number(sItem.quantity),
          price: invItem.unitPrice * 1.4 // Sales markup
        };
      });

      const totalAmount = processedItems.reduce((acc, current) => acc + (current.quantity * current.price), 0);
      const soNumber = 'SO-2026-' + Math.floor(100 + Math.random() * 900);

      const newSO: SalesOrder = {
        id: 'so-' + Math.random().toString(36).substring(2, 9),
        soNumber,
        customerName,
        items: processedItems,
        totalAmount,
        status: 'Processing',
        paymentStatus: 'Pending',
        invoiceId: 'INV-' + Math.floor(1000 + Math.random() * 9000),
        orderDate: new Date().toISOString()
      };

      db.salesOrders.push(newSO);

      addBlockchainBlock(
        db,
        'SALES_ORDER_CREATED',
        newSO.id,
        'Order',
        `Sales Order '${soNumber}' for client '${customerName}' was generated in state 'Processing' for amount of $${totalAmount.toFixed(2)}.`,
        'SALES_AGENT',
        `${soNumber} ${customerName} $${totalAmount}`
      );

      saveDB(db);
      res.status(201).json(newSO);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Failed to create Sales Order" });
    }
  });

  // API Route - Disptach Sales Order (Deduct inventory, launch shipment)
  app.post("/api/sales-orders/:id/dispatch", requireAuth, (req, res) => {
    const db = loadDB();
    const soId = req.params.id;
    const so = db.salesOrders.find(s => s.id === soId);

    if (!so) {
      res.status(404).json({ error: "Sales Order not found" });
      return;
    }

    if (so.status !== 'Processing') {
      res.status(400).json({ error: "Only sales orders in 'Processing' state can be dispatched." });
      return;
    }

    // Validate quantities again
    let stockValid = true;
    let errorMessage = "";
    so.items.forEach(oItem => {
      const invItem = db.inventory.find(i => i.id === oItem.itemId);
      if (!invItem || invItem.quantity < oItem.quantity) {
        stockValid = false;
        errorMessage = `Insufficient stock for '${oItem.name}'. Available: ${invItem ? invItem.quantity : 0}, Required: ${oItem.quantity}`;
      }
    });

    if (!stockValid) {
      res.status(400).json({ error: errorMessage });
      return;
    }

    so.status = 'Shipped';

    // Deduct stock
    so.items.forEach(oItem => {
      const invItem = db.inventory.find(i => i.id === oItem.itemId);
      if (invItem) {
        invItem.quantity -= oItem.quantity;
        const wh = db.warehouses.find(w => w.id === invItem.warehouseId);
        if (wh) {
          wh.usedCapacity = Math.max(0, wh.usedCapacity - oItem.quantity);
        }

        addBlockchainBlock(
          db,
          'INVENTORY_SHIPPED',
          invItem.id,
          'Inventory',
          `Inventory count for '${invItem.name}' decremented by -${oItem.quantity} for fulfillment of order '${so.soNumber}'.`,
          'WAREHOUSE_PICKER',
          `${invItem.sku} -${oItem.quantity}`
        );
      }
    });

    // Create outbound shipment
    const firstItem = so.items[0];
    const itemInv = db.inventory.find(i => i.id === firstItem.itemId);
    const originWH = db.warehouses.find(w => w.id === itemInv?.warehouseId);

    const shipmentNumber = 'SH-2026-' + Math.floor(100 + Math.random() * 900);
    const newShipment: Shipment = {
      id: 'ship-' + Math.random().toString(36).substring(2, 9),
      shipmentNumber,
      orderId: so.id,
      orderNumber: so.soNumber,
      orderType: 'Sales',
      origin: originWH ? `${originWH.name} (${originWH.location})` : 'Distribution Center',
      destination: `${so.customerName} (Client Office)`,
      carrier: 'UPS Supply Chain Solutions',
      trackingNumber: 'TRK-UPS-' + Math.floor(100000 + Math.random() * 900000),
      status: 'In Transit',
      currentTemp: 21.0,
      currentHumidity: 48.0,
      currentGForce: 1.0,
      sensorHistory: [
        { timestamp: new Date().toISOString(), temp: 21.0, humidity: 48.0, gForce: 1.0 }
      ],
      updatedAt: new Date().toISOString()
    };

    db.shipments.push(newShipment);

    addBlockchainBlock(
      db,
      'SALES_ORDER_SHIPPED',
      so.id,
      'Order',
      `Sales Order '${so.soNumber}' dispatched from warehouse. Shipment tracking '${newShipment.shipmentNumber}' registered.`,
      'LOGISTICS_DISPATCH',
      `${so.soNumber} Dispatch Shipment:${newShipment.shipmentNumber}`
    );

    addBlockchainBlock(
      db,
      'OUTBOUND_SHIPMENT_LAUNCHED',
      newShipment.id,
      'Shipment',
      `Outbound Cargo '${newShipment.shipmentNumber}' has started transit to customer '${so.customerName}'.`,
      'LOGISTICS_CARRIER',
      `${newShipment.shipmentNumber} Destination:${so.customerName}`
    );

    saveDB(db);
    res.json(so);
  });

  // API Route - Mark Outbound SO Completed
  app.post("/api/sales-orders/:id/complete", requireAuth, (req, res) => {
    const db = loadDB();
    const soId = req.params.id;
    const so = db.salesOrders.find(s => s.id === soId);

    if (!so) {
      res.status(404).json({ error: "Sales Order not found" });
      return;
    }

    if (so.status !== 'Shipped') {
      res.status(400).json({ error: "Only shipped sales orders can be marked as completed." });
      return;
    }

    so.status = 'Completed';

    // Complete shipment
    const shipment = db.shipments.find(s => s.orderId === so.id);
    if (shipment) {
      shipment.status = 'Delivered';
      shipment.updatedAt = new Date().toISOString();
      addBlockchainBlock(
        db,
        'SHIPMENT_DELIVERED',
        shipment.id,
        'Shipment',
        `Shipment '${shipment.shipmentNumber}' safely delivered to client location. Integrity telemetry closed.`,
        'LOGISTICS_CARRIER',
        `${shipment.shipmentNumber} Delivered`
      );
    }

    addBlockchainBlock(
      db,
      'SALES_ORDER_COMPLETED',
      so.id,
      'Order',
      `Sales Order '${so.soNumber}' has been finalized and accepted by customer.`,
      'SALES_MANAGER',
      `${so.soNumber} Completed`
    );

    saveDB(db);
    res.json(so);
  });

  // API Route - Get Shipments
  app.get("/api/shipments", requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.shipments);
  });

  // API Route - Feed Telemetry Sensor data (IoT telemetry tracking)
  app.post("/api/shipments/:id/telemetry", requireAuth, (req, res) => {
    const db = loadDB();
    const shipId = req.params.id;
    const { temp, humidity, gForce } = req.body;

    if (temp === undefined || humidity === undefined || gForce === undefined) {
      res.status(400).json({ error: "Incomplete sensor readings" });
      return;
    }

    const shipment = db.shipments.find(s => s.id === shipId);
    if (!shipment) {
      res.status(404).json({ error: "Shipment not found" });
      return;
    }

    if (shipment.status === 'Delivered') {
      res.status(400).json({ error: "Cargo is already delivered. Telemetry disabled." });
      return;
    }

    const numericTemp = Number(temp);
    const numericHumidity = Number(humidity);
    const numericGForce = Number(gForce);

    const reading = {
      timestamp: new Date().toISOString(),
      temp: numericTemp,
      humidity: numericHumidity,
      gForce: numericGForce
    };

    shipment.currentTemp = numericTemp;
    shipment.currentHumidity = numericHumidity;
    shipment.currentGForce = numericGForce;
    shipment.sensorHistory.push(reading);
    shipment.updatedAt = new Date().toISOString();

    // Trigger blockchain alarms if safety thresholds are violated!
    // Thresholds: Temp > 25°C (Cold chain breach), GForce > 1.8G (Fragile handling violation)
    if (numericTemp > 25.0) {
      addBlockchainBlock(
        db,
        'TELEMETRY_ALARM_BREACH',
        shipment.id,
        'Shipment',
        `CRITICAL BREACH: Temperature spike detected in cargo '${shipment.shipmentNumber}' (${numericTemp}°C). Safety threshold of 25°C was exceeded!`,
        'IOT_SENSOR_GATEWAY',
        `${shipment.shipmentNumber} TEMP_BREACH:${numericTemp}`
      );
      shipment.status = 'Delayed'; // Impose logistics hold
    }

    if (numericGForce > 1.8) {
      addBlockchainBlock(
        db,
        'TELEMETRY_IMPACT_BREACH',
        shipment.id,
        'Shipment',
        `IMPACT BREACH: High force impact detected on container '${shipment.shipmentNumber}' (${numericGForce}G). Fragile handling standard violated!`,
        'IOT_SENSOR_GATEWAY',
        `${shipment.shipmentNumber} IMPACT_VIOLATION:${numericGForce}`
      );
    }

    saveDB(db);
    res.json(shipment);
  });

  // API Route - Get Blockchain
  app.get("/api/blockchain", requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.blockchain);
  });

  // GET /api/getChain - Retrieve the entire blockchain ledger
  app.get("/api/getChain", requireAuth, (req, res) => {
    const db = loadDB();
    res.json(db.blockchain);
  });

  // POST /api/addBlock - Create and append a manual block to the cryptographic chain
  app.post("/api/addBlock", requireAuth, (req, res) => {
    const db = loadDB();
    const { action, entityId, entityType, details, operator, trackingCode } = req.body;

    if (!action || !entityId || !entityType || !details) {
      res.status(400).json({ error: "Missing required fields: action, entityId, entityType, details" });
      return;
    }

    const newBlock = addBlockchainBlock(
      db,
      action,
      entityId,
      entityType,
      details,
      operator || "OPERATOR",
      trackingCode || "MANUAL_TRACE"
    );

    res.status(201).json(newBlock);
  });

  // POST /api/blockchain/tamper - Tamper with a block's text to trigger cryptographic validation alarms
  app.post("/api/blockchain/tamper", requireAuth, (req, res) => {
    const db = loadDB();
    const { index, details } = req.body;

    if (index === undefined || !details) {
      res.status(400).json({ error: "Missing block index or tamper details" });
      return;
    }

    const block = db.blockchain.find((b: any) => b.index === Number(index));
    if (!block) {
      res.status(404).json({ error: "Block not found" });
      return;
    }

    // Alter the block details directly on the server to corrupt the SHA-256 hash
    block.data.details = details;
    saveDB(db);

    res.json({ message: "Block data successfully corrupted. Run integrity validation to inspect errors.", block });
  });

  // POST /api/blockchain/restore - Re-seed the blockchain ledger to a pristine valid state
  app.post("/api/blockchain/restore", requireAuth, (req, res) => {
    const db = loadDB();
    
    // Restore the database state to original seeded blockchain blocks
    const initialChain = [
      {
        index: 1,
        timestamp: '2026-07-02T10:00:00Z',
        data: {
          action: 'GENESIS_SYSTEM_LAUNCH',
          entityId: 'sys-0000',
          entityType: 'System',
          details: 'AI-Powered Blockchain-Based Supply Chain Management System bootstrapped successfully.',
          operator: 'SYSTEM_CREATOR',
          trackingCode: 'NEXUS-SCM-ACTIVE'
        },
        previousHash: '0'
      }
    ] as any[];

    // Calculate real hashes and signatures for original seeds to ensure validity
    const gHash = calculateBlockHash(1, initialChain[0].timestamp, initialChain[0].data, '0');
    initialChain[0].hash = gHash;
    initialChain[0].signature = generateBlockSignature(gHash);

    const b2Data = {
      action: 'INVENTORY_INITIALIZED',
      entityId: 'inv-seed1',
      entityType: 'Inventory',
      details: 'Inventory item \'Advanced Microprocessors\' (SKU-CPU-902) initialized at warehouse with quantity 1200.',
      operator: 'SYSTEM_CREATOR',
      trackingCode: 'SKU-CPU-902 Qty:1200'
    };
    const b2Timestamp = '2026-07-03T12:00:00Z';
    const b2Hash = calculateBlockHash(2, b2Timestamp, b2Data, gHash);
    const b2Sig = generateBlockSignature(b2Hash);

    initialChain.push({
      index: 2,
      timestamp: b2Timestamp,
      data: b2Data,
      previousHash: gHash,
      hash: b2Hash,
      signature: b2Sig
    });

    db.blockchain = initialChain;
    saveDB(db);

    res.json({ message: "Cryptographic ledger restored to secure and verified state.", blockchain: db.blockchain });
  });

  // API Route - Verify Entity History in Blockchain
  app.get("/api/blockchain/entity/:entityId", requireAuth, (req, res) => {
    const db = loadDB();
    const entityId = req.params.entityId;
    const history = db.blockchain.filter((b: any) => b.data.entityId === entityId);
    res.json(history);
  });

  // API Route - Verify Blockchain Ledger Integrity
  app.get("/api/blockchain/verify", requireAuth, (req, res) => {
    const db = loadDB();
    const chain = db.blockchain;
    let isValid = true;
    const errors: string[] = [];

    for (let i = 0; i < chain.length; i++) {
      const currentBlock = chain[i];
      
      // 1. Recalculate Hash
      const reCalculatedHash = calculateBlockHash(
        currentBlock.index, 
        currentBlock.timestamp, 
        currentBlock.data, 
        currentBlock.previousHash
      );

      if (currentBlock.hash !== reCalculatedHash) {
        isValid = false;
        errors.push(`Block #${currentBlock.index} hash is corrupted! Re-calculated: ${reCalculatedHash}, Saved: ${currentBlock.hash}`);
      }

      // 2. Validate Previous Hash pointer
      if (i > 0) {
        const previousBlock = chain[i - 1];
        if (currentBlock.previousHash !== previousBlock.hash) {
          isValid = false;
          errors.push(`Block #${currentBlock.index} backlink is broken! Points to ${currentBlock.previousHash}, expected previous block hash is ${previousBlock.hash}`);
        }
      }

      // 3. Verify Signature correctness
      const reCalculatedSig = generateBlockSignature(currentBlock.hash);
      if (currentBlock.signature !== reCalculatedSig) {
        isValid = false;
        errors.push(`Block #${currentBlock.index} signature is unverified or tampered with!`);
      }
    }

    res.json({
      verified: isValid,
      totalBlocks: chain.length,
      errors
    });
  });

  // API Route - AI Shortage Predictions (Structured Schema)
  app.get("/api/ai/predict-shortages", requireAuth, async (req, res) => {
    try {
      const db = loadDB();
      const client = getGeminiClient();

      const itemsStr = db.inventory.map(i => {
        return `Item ID: ${i.id}, SKU: ${i.sku}, Name: ${i.name}, Quantity: ${i.quantity} ${i.unit}, Reorder Point: ${i.reorderPoint}, Unit Price: $${i.unitPrice}`;
      }).join('\n');

      const prompt = `Perform an inventory shortage risk assessment and predict potential stockouts for our warehouse management system.
We have the following inventory list in active warehouses:
${itemsStr}

Analyze the quantity vs reorderPoint. Predict how many days of runway remain based on standard enterprise draw-down rates (assume average daily usage is roughly 2% of reorder points). For items that are close to or below reorder points, predict rapid stockout, generate smart strategic recommendation plans (e.g. recommend a specific supplier to order from based on current stockouts and supplier ratings), and assign a high confidence level.

Return a JSON array of prediction objects conforming strictly to this format:`;

      const interaction = await client.interactions.create({
        model: "gemini-3.5-flash",
        input: prompt,
        response_format: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemId: { type: Type.STRING, description: "The ID of the inventory item." },
              itemName: { type: Type.STRING, description: "The name of the inventory item." },
              sku: { type: Type.STRING, description: "The SKU code." },
              currentQuantity: { type: Type.NUMBER, description: "The current count available." },
              predictedDaysToStockout: { type: Type.NUMBER, description: "Estimated days remaining until stockout (0 means already out of stock or below critical buffer)." },
              recommendedAction: { type: Type.STRING, description: "Clear strategic recommended procurement action." },
              confidence: { type: Type.NUMBER, description: "Score between 0 and 100 for prediction confidence." }
            },
            required: ["itemId", "itemName", "sku", "currentQuantity", "predictedDaysToStockout", "recommendedAction", "confidence"]
          }
        }
      });

      let responseText = "[]";
      const lastStep = interaction.steps.at(-1);
      if (lastStep && lastStep.type === 'model_output') {
        const textContent = lastStep.content?.find(c => c.type === 'text');
        if (textContent) {
          responseText = textContent.text;
        }
      }
      res.json(JSON.parse(responseText.trim()));
    } catch (e: any) {
      console.error("Gemini shortage prediction error:", e);
      // Fallback heuristic calculations if Gemini fails or is unconfigured
      const db = loadDB();
      const fallbacks = db.inventory.map(i => {
        const days = i.quantity <= i.reorderPoint ? Math.max(1, Math.floor(i.quantity / 15)) : Math.floor((i.quantity - i.reorderPoint) / 10 + 15);
        return {
          itemId: i.id,
          itemName: i.name,
          sku: i.sku,
          currentQuantity: i.quantity,
          predictedDaysToStockout: i.quantity <= i.reorderPoint ? 3 : days,
          recommendedAction: i.quantity <= i.reorderPoint 
            ? `Procure 1,500 units from active supplier immediately to restore safety buffer.` 
            : `Schedule replenishment batch within ${days} days.`,
          confidence: 85
        };
      });
      res.json(fallbacks);
    }
  });

  // Helper function to execute SCM database and blockchain tools
  function executeScmTool(name: string, args: any, db: any): string {
    if (name === "getInventoryLevels") {
      return `Current Inventory Levels:\n` + db.inventory.map((i: any) => 
        `- SKU: ${i.sku} | Item: ${i.name} | Qty: ${i.quantity} ${i.unit} | Warehouse: ${i.warehouseId} | Supplier: ${i.supplierId} | Reorder Point: ${i.reorderPoint} | Price: $${i.unitPrice}`
      ).join('\n');
    }
    
    if (name === "getAllSuppliers") {
      return `Active Suppliers:\n` + db.suppliers.map((s: any) => 
        `- ID: ${s.id} | Name: ${s.name} | Contact: ${s.contactName} | Email: ${s.email} | Location: ${s.location} | Rating: ${s.rating} | Status: ${s.status}`
      ).join('\n');
    }
    
    if (name === "dispatchSalesOrder") {
      const { salesOrderId } = args;
      if (!salesOrderId) return "Error: salesOrderId is required.";
      
      // Find sales order by ID or SO number
      const so = db.salesOrders.find((s: any) => s.id === salesOrderId || s.soNumber === salesOrderId);
      if (!so) {
        return `Error: Sales Order ID/Number '${salesOrderId}' not found.`;
      }
      
      if (so.status !== 'Processing') {
        return `Error: Sales Order is in '${so.status}' state. Can only dispatch orders in Processing state.`;
      }
      
      // Validate quantities
      let stockValid = true;
      let errorMessage = "";
      so.items.forEach((oItem: any) => {
        const invItem = db.inventory.find((i: any) => i.id === oItem.itemId);
        if (!invItem || invItem.quantity < oItem.quantity) {
          stockValid = false;
          errorMessage = `Insufficient stock for '${oItem.name}'. Available: ${invItem ? invItem.quantity : 0}, Required: ${oItem.quantity}`;
        }
      });
      
      if (!stockValid) {
        return `Error: ${errorMessage}`;
      }
      
      so.status = 'Shipped';
      
      // Deduct stock
      let originLocation = "Distribution Center";
      so.items.forEach((oItem: any) => {
        const invItem = db.inventory.find((i: any) => i.id === oItem.itemId);
        if (invItem) {
          invItem.quantity -= oItem.quantity;
          const wh = db.warehouses.find((w: any) => w.id === invItem.warehouseId);
          if (wh) {
            wh.usedCapacity = Math.max(0, wh.usedCapacity - oItem.quantity);
            originLocation = `${wh.name} (${wh.location})`;
          }
          
          addBlockchainBlock(
            db,
            'INVENTORY_SHIPPED',
            invItem.id,
            'Inventory',
            `Inventory count for '${invItem.name}' decremented by -${oItem.quantity} for fulfillment of order '${so.soNumber}'.`,
            'SCM_AI_AGENT',
            `${invItem.sku} -${oItem.quantity}`
          );
        }
      });
      
      // Create outbound shipment
      const shipmentNumber = 'SH-2026-' + Math.floor(100 + Math.random() * 900);
      const newShipment: Shipment = {
        id: 'ship-' + Math.random().toString(36).substring(2, 9),
        shipmentNumber,
        orderId: so.id,
        orderNumber: so.soNumber,
        orderType: 'Sales',
        origin: originLocation,
        destination: `${so.customerName} (Client Office)`,
        carrier: 'UPS Supply Chain Solutions',
        trackingNumber: 'TRK-UPS-' + Math.floor(100000 + Math.random() * 900000),
        status: 'In Transit',
        currentTemp: 21.0,
        currentHumidity: 48.0,
        currentGForce: 1.0,
        sensorHistory: [
          { timestamp: new Date().toISOString(), temp: 21.0, humidity: 48.0, gForce: 1.0 }
        ],
        updatedAt: new Date().toISOString()
      };
      
      db.shipments.push(newShipment);
      
      addBlockchainBlock(
        db,
        'SHIPMENT_LAUNCHED',
        newShipment.id,
        'Shipment',
        `Outbound IoT Shipment '${shipmentNumber}' launched for Order '${so.soNumber}'. Tracking URL is active.`,
        'SCM_AI_AGENT',
        `${shipmentNumber} Status:InTransit`
      );
      
      addBlockchainBlock(
        db,
        'SALES_ORDER_DISPATCHED_BY_AGENT',
        so.id,
        'Order',
        `Sales Order '${so.soNumber}' dispatched from warehouse by SCM-AI Agent. Outbound Shipment registered.`,
        'SCM_AI_AGENT',
        `${so.soNumber} Status:Shipped`
      );
      
      saveDB(db);
      return `Success: Sales Order ${so.soNumber} successfully dispatched. Outbound Shipment ${shipmentNumber} created and logged on blockchain.`;
    }
    
    if (name === "receivePurchaseOrder") {
      const { purchaseOrderId } = args;
      if (!purchaseOrderId) return "Error: purchaseOrderId is required.";
      
      // Find PO by ID or PO number
      const po = db.purchaseOrders.find((p: any) => p.id === purchaseOrderId || p.poNumber === purchaseOrderId);
      if (!po) {
        return `Error: Purchase Order ID/Number '${purchaseOrderId}' not found.`;
      }
      
      if (po.status === 'Received') {
        return `Error: Purchase Order ${po.poNumber} has already been received.`;
      }
      
      po.status = 'Received';
      
      // Increment stock
      po.items.forEach((orderItem: any) => {
        const invItem = db.inventory.find((i: any) => i.id === orderItem.itemId);
        if (invItem) {
          invItem.quantity += orderItem.quantity;
          const wh = db.warehouses.find((w: any) => w.id === invItem.warehouseId);
          if (wh) {
            wh.usedCapacity += orderItem.quantity;
          }
          
          addBlockchainBlock(
            db,
            'INVENTORY_RECEIVED',
            invItem.id,
            'Inventory',
            `Inventory count for '${invItem.name}' incremented by +${orderItem.quantity} units from received PO '${po.poNumber}'.`,
            'SCM_AI_AGENT',
            `${invItem.sku} +${orderItem.quantity}`
          );
        }
      });
      
      // Update matching shipment
      const shipment = db.shipments.find((s: any) => s.orderId === po.id);
      if (shipment) {
        shipment.status = 'Delivered';
        shipment.updatedAt = new Date().toISOString();
        addBlockchainBlock(
          db,
          'SHIPMENT_DELIVERED',
          shipment.id,
          'Shipment',
          `Shipment '${shipment.shipmentNumber}' marked as Delivered. Cold chain telemetry closed.`,
          'SCM_AI_AGENT',
          `${shipment.shipmentNumber} Status:Delivered`
        );
      }
      
      addBlockchainBlock(
        db,
        'PO_RECEIVED_BY_AGENT',
        po.id,
        'Order',
        `Purchase Order '${po.poNumber}' marked as fully Received and processed by SCM-AI Agent.`,
        'SCM_AI_AGENT',
        `${po.poNumber} Status:Received`
      );
      
      saveDB(db);
      return `Success: Purchase Order ${po.poNumber} received. Inventory stocks and warehouse storage capacity updated and logged on blockchain.`;
    }
    
    if (name === "trackShipment") {
      const { shipmentId } = args;
      if (!shipmentId) return "Error: shipmentId is required.";
      const shipment = db.shipments.find((s: any) => s.id === shipmentId || s.shipmentNumber === shipmentId);
      if (!shipment) return "Error: Shipment not found.";
      return `Shipment ${shipment.shipmentNumber}: Status ${shipment.status}, Current Location: ${shipment.origin} -> ${shipment.destination}, Temp: ${shipment.currentTemp}°C, Humidity: ${shipment.currentHumidity}%, Last Update: ${shipment.updatedAt}`;
    }

    if (name === "generatePurchaseOrder") {
      const { supplierId, items } = args;
      if (!supplierId || !items) return "Error: supplierId and items are required.";
      const supplier = db.suppliers.find((s: any) => s.id === supplierId);
      if (!supplier) return "Error: Supplier not found.";
      
      const processedItems = items.map((pItem: any) => {
        const invItem = db.inventory.find((i: any) => i.id === pItem.itemId);
        if (!invItem) throw new Error(`Inventory item ${pItem.itemId} not found`);
        return { itemId: invItem.id, name: invItem.name, quantity: Number(pItem.quantity), price: invItem.unitPrice };
      });
      const totalAmount = processedItems.reduce((acc: number, current: any) => acc + (current.quantity * current.price), 0);
      const poNumber = 'PO-2026-' + Math.floor(100 + Math.random() * 900);
      const newPO = { id: 'po-' + Math.random().toString(36).substring(2, 9), poNumber, supplierId, supplierName: supplier.name, items: processedItems, totalAmount, status: 'Sent', orderDate: new Date().toISOString() };
      db.purchaseOrders.push(newPO);
      saveDB(db);
      return `Success: Purchase Order ${poNumber} created for supplier ${supplier.name} with total amount $${totalAmount}.`;
    }

    if (name === "getBusinessAnalytics") {
      const totalAssets = db.inventory.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0);
      return `Business Analytics Snapshot:
      - Total Asset Value: $${totalAssets}
      - Open Purchase Orders: ${db.purchaseOrders.filter((po: any) => po.status !== 'Received').length}
      - Open Sales Orders: ${db.salesOrders.filter((so: any) => so.status !== 'Completed').length}
      - Total Active Shipments: ${db.shipments.filter((s: any) => s.status === 'In Transit').length}`;
    }
    
    if (name === "getBlockchainHistory") {
      const { entityId } = args;
      if (!entityId) return "Error: entityId is required.";
      const history = db.blockchain.filter((b: any) => b.data.entityId === entityId);
      if (history.length === 0) return `No blockchain history found for entity ID '${entityId}'.`;
      return `Blockchain History for ${entityId}:\n` + history.map((b: any) => 
        `- #${b.index} [${b.data.action}] at ${b.timestamp}: ${b.data.details} | Operator: ${b.data.operator}`
      ).join('\n');
    }
    
    return `Error: Unknown tool '${name}'.`;
  }

  // API Route - AI Chat Support with Multi-Provider, RAG and Tool Calling
  app.post(["/chat", "/api/ai/chat"], requireAuth, async (req, res) => {
    try {
      const { 
        message, 
        history, 
        provider = "gemini", 
        apiKey, 
        baseUrl, 
        modelName, 
        ragEnabled = true, 
        toolsEnabled = true 
      } = req.body;

      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const db = loadDB();

      // Formulate state snapshot context to feed the AI
      let context = "";
      if (ragEnabled) {
        context = `
SYSTEM SNAPSHOT (RAG CONTEXT):
- Suppliers:
${db.suppliers.map(s => `  * ${s.name} (ID: ${s.id}, Contact: ${s.contactName}, Email: ${s.email}, Loc: ${s.location}, Rating: ${s.rating}, Status: ${s.status})`).join('\n')}

- Warehouses:
${db.warehouses.map(w => `  * ${w.name} (ID: ${w.id}, Loc: ${w.location}, Capacity: ${w.usedCapacity}/${w.capacity}, Mgr: ${w.managerName}, Status: ${w.status})`).join('\n')}

- Active Inventory:
${db.inventory.map(i => `  * ${i.name} (ID: ${i.id}, SKU: ${i.sku}, Qty: ${i.quantity} ${i.unit}, Reorder Point: ${i.reorderPoint}, Price: $${i.unitPrice}, Warehouse ID: ${i.warehouseId}, Supplier ID: ${i.supplierId})`).join('\n')}

- Open Purchase Orders:
${db.purchaseOrders.map(p => `  * PO ${p.poNumber} (ID: ${p.id}, Supplier: ${p.supplierName}, Total: $${p.totalAmount}, Status: ${p.status}, OrderDate: ${p.orderDate})`).join('\n')}

- Open Sales Orders:
${db.salesOrders.map(s => `  * SO ${s.soNumber} (ID: ${s.id}, Customer: ${s.customerName}, Total: $${s.totalAmount}, Status: ${s.status}, OrderDate: ${s.orderDate})`).join('\n')}

- Shipment tracking:
${db.shipments.map(s => `  * Cargo ${s.shipmentNumber} [${s.orderType} order ${s.orderNumber}] - Carrier: ${s.carrier} (Track: ${s.trackingNumber}, Status: ${s.status}, Current Temp: ${s.currentTemp}°C, Humidity: ${s.currentHumidity}%, Impact G-force: ${s.currentGForce}G)`).join('\n')}

- Recent Blockchain Audits (last 5 blocks):
${db.blockchain.slice(-5).map(b => `  * Block #${b.index} [${b.data.action}] - ${b.data.details} (Signature: ${b.signature.substring(0, 16)}...)`).join('\n')}
`;
      } else {
        context = `SYSTEM SNAPSHOT: (RAG is disabled. Live database context is unattached. Answer questions based on system configuration rules and general knowledge.)`;
      }

      let systemInstruction = `You are the core Logistics AI Agent integrated within the AI-Powered Blockchain Supply Chain & Warehouse Management System.
Current UTC time: ${new Date().toISOString()}

${context}

Use the snapshot above (if RAG is enabled) to answer questions with 100% precision. Never make up numbers.
Acknowledge that shipments and inventory changes are logged to the cryptographic blockchain ledger with hash blocks and digital signatures.
Keep your tone polite, professional, and business-focused.`;

      if (toolsEnabled) {
        systemInstruction += `

AGENT SCM TOOLS:
You have permission to perform automated database and blockchain ledger operations when instructed.
To trigger an SCM database action, you MUST output a single valid JSON block in your response using this precise schema:
\`\`\`json
{
  "tool": "dispatchSalesOrder" | "receivePurchaseOrder" | "getInventoryLevels" | "getAllSuppliers" | "trackShipment" | "generatePurchaseOrder" | "getBusinessAnalytics" | "getBlockchainHistory",
  "args": {
    "salesOrderId": "string" (for dispatchSalesOrder),
    "purchaseOrderId": "string" (for receivePurchaseOrder),
    "shipmentId": "string" (for trackShipment),
    "supplierId": "string",
    "items": "array of {itemId, quantity}" (for generatePurchaseOrder),
    "entityId": "string" (for getBlockchainHistory)
  }
}
\`\`\`
Rules for tools:
1. ONLY output this JSON block if the operator explicitly asks you to dispatch a sales order, receive a purchase order, list inventory levels, list suppliers, track a shipment, generate a purchase order, provide business analytics, or get blockchain history.
2. If you output a JSON block, the backend SCM system will capture it, execute the action, update the cryptographic ledger, and feed the success result back to you to formulate a confirmation. Do not write text *inside* the JSON. Include the JSON block on its own line.`;
      }

      // We'll run the model call based on selected provider
      let content = "";
      let toolExecutionLog = "";

      const callModel = async (promptMsg: string, convHistory: any[]) => {
        if (provider === "openai") {
          const activeKey = apiKey || process.env.OPENAI_API_KEY;
          if (!activeKey) {
            throw new Error("OpenAI API Key is not configured. Please supply an API key in the Agent settings.");
          }
          const modelToUse = modelName || "gpt-4o-mini";
          const messages = [
            { role: "system", content: systemInstruction },
            ...convHistory.map(h => ({
              role: h.role === "assistant" ? "assistant" : "user",
              content: h.content
            })),
            { role: "user", content: promptMsg }
          ];

          const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${activeKey}`
            },
            body: JSON.stringify({
              model: modelToUse,
              messages,
              temperature: 0.2
            })
          });

          if (!openAiRes.ok) {
            const errData = await openAiRes.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `OpenAI API returned status ${openAiRes.status}`);
          }

          const openAiData = await openAiRes.json();
          return openAiData.choices?.[0]?.message?.content || "";
        } else if (provider === "ollama") {
          const activeUrl = baseUrl || "http://localhost:11434";
          const modelToUse = modelName || "llama3";
          const messages = [
            { role: "system", content: systemInstruction },
            ...convHistory.map(h => ({
              role: h.role === "assistant" ? "assistant" : "user",
              content: h.content
            })),
            { role: "user", content: promptMsg }
          ];

          const ollamaRes = await fetch(`${activeUrl}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: modelToUse,
              messages,
              temperature: 0.2,
              stream: false
            })
          });

          if (!ollamaRes.ok) {
            throw new Error(`Ollama API returned status ${ollamaRes.status} at ${activeUrl}`);
          }

          const ollamaData = await ollamaRes.json();
          return ollamaData.choices?.[0]?.message?.content || "";
        } else {
          // Default: Gemini via @google/genai SDK
          const client = getGeminiClient();
          const chatContents = convHistory ? convHistory.map((chat: any) => ({
            role: chat.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: chat.content }]
          })) : [];

          chatContents.push({
            role: 'user',
            parts: [{ text: promptMsg }]
          });

          const response = await client.models.generateContent({
            model: modelName || "gemini-3.5-flash",
            contents: chatContents,
            config: {
              systemInstruction,
              temperature: 0.2
            }
          });

          return response.text || "";
        }
      };

      // 1. Initial invocation
      let historyList = history || [];
      content = await callModel(message, historyList);

      // 2. Parse for JSON Tool Calling if tools are enabled
      if (toolsEnabled) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/({[\s\S]*?"tool"[\s\S]*?})/);
        if (jsonMatch) {
          try {
            const toolData = JSON.parse(jsonMatch[1]);
            if (toolData && toolData.tool) {
              const toolResult = executeScmTool(toolData.tool, toolData.args || {}, db);
              toolExecutionLog = `[Executed SCM Tool: ${toolData.tool} with result: ${toolResult}]`;
              
              // We make a second call to the model to explain the execution success!
              const followupPrompt = `${message}\n\n[SYSTEM NOTIFICATION: SCM Tool executed automatically]\nTool Call: ${JSON.stringify(toolData)}\nExecution Result: ${toolResult}\n\nPlease output a friendly, professional explanation confirming to the operator that the SCM transaction is fully complete and cryptographically committed to the blockchain.`;
              
              content = await callModel(followupPrompt, historyList);
            }
          } catch (jsonErr: any) {
            console.error("Tool execution json parse error:", jsonErr);
          }
        }
      }

      res.json({
        content: content,
        toolExecution: toolExecutionLog || undefined,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      console.error("AI Chat error:", e);
      res.status(500).json({ error: e.message || "Failed to contact the AI Agent." });
    }
  });

  // Global Error Handler
  app.use(errorHandler);

  // Standalone Server Launcher (dev Vite middleware or production static files)
  async function startServer() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Supply Chain backend running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  }

  // Only start the standalone HTTP listener when not running in Vercel Serverless environment
  if (!process.env.VERCEL) {
    startServer();
  }

  export default app;
