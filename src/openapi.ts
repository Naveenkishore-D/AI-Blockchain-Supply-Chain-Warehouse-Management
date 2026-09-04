export const openapiSpecification = {
  openapi: "3.0.0",
  info: {
    title: "Nexus Supply Chain & Ledger API",
    description:
      "Enterprise-grade SCM API suite driving cold chain tracking, automated warehouse allocations, real-time IoT sensory telemetry, cryptographic immutable block logs, and intelligent AI shortage predictions.",
    version: "1.0.0",
    contact: {
      name: "Nexus DevOps SCM Core",
      email: "support@nexus-ledger.io",
    },
  },
  servers: [
    {
      url: "/",
      description: "Local Server",
    },
  ],
  paths: {
    "/api/health": {
      get: {
        summary: "API Health Check",
        description:
          "Returns the operational status, current time, and service diagnostics.",
        responses: {
          "200": {
            description: "API is healthy and online.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    time: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/suppliers": {
      get: {
        summary: "Get All Active Suppliers",
        description:
          "Retrieve a list of registered material/part suppliers from the secure storage.",
        responses: {
          "200": {
            description: "Success retrieving list of suppliers.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Supplier",
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Register a New Supplier",
        description:
          "Registers a new vendor partner and commits an entry onto the cryptographic ledger.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "contactName", "email", "location"],
                properties: {
                  name: { type: "string", example: "Zenith Electronics Corp" },
                  contactName: { type: "string", example: "Sarah Jenkins" },
                  email: {
                    type: "string",
                    example: "sjenkins@zenithelectronics.com",
                  },
                  phone: { type: "string", example: "+1-555-0128" },
                  location: { type: "string", example: "Silicon Valley, CA" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Supplier registered successfully.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Supplier",
                },
              },
            },
          },
          "400": {
            description: "Missing required parameters.",
          },
        },
      },
    },
    "/api/warehouses": {
      get: {
        summary: "Get All Warehouses",
        description:
          "Query details for all registered warehouse and fulfillment hub locations.",
        responses: {
          "200": {
            description: "Success.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Warehouse",
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Provision a Warehouse Location",
        description:
          "Saves a new storage hub, initializing storage capacities.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "location", "capacity", "managerName"],
                properties: {
                  name: {
                    type: "string",
                    example: "Central Storage Hub Alpha",
                  },
                  location: { type: "string", example: "Chicago, IL" },
                  capacity: { type: "number", example: 50000 },
                  managerName: { type: "string", example: "Robert Carter" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Warehouse registered.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Warehouse",
                },
              },
            },
          },
          "400": {
            description: "Incomplete details.",
          },
        },
      },
    },
    "/api/inventory": {
      get: {
        summary: "Query Inventory Levels",
        description:
          "Queries active counts across all categories and warehouse bins.",
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number for pagination",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
            description: "Number of items per page",
          },
          {
            name: "sortBy",
            in: "query",
            schema: { type: "string" },
            description: "Field to sort by",
          },
          {
            name: "sortOrder",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"] },
            description: "Sort direction",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search term",
          },
          {
            name: "category",
            in: "query",
            schema: { type: "string" },
            description: "Filter by category",
          },
        ],
        responses: {
          "200": {
            description: "A list of inventory items.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    totalPages: { type: "integer" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/InventoryItem" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Initialize an Inventory Stock",
        description:
          "Registers a new cataloged SKU code, associating it with a supplier and a specific warehouse location.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "name",
                  "sku",
                  "category",
                  "quantity",
                  "unit",
                  "warehouseId",
                  "supplierId",
                  "reorderPoint",
                  "unitPrice",
                ],
                properties: {
                  name: {
                    type: "string",
                    example: "Quantum Processor Unit (QPU-x1)",
                  },
                  sku: { type: "string", example: "SKU-QPU-098" },
                  category: { type: "string", example: "Processors" },
                  quantity: { type: "number", example: 1200 },
                  unit: { type: "string", example: "Units" },
                  warehouseId: { type: "string", example: "wh-1" },
                  supplierId: { type: "string", example: "sup-1" },
                  reorderPoint: { type: "number", example: 500 },
                  unitPrice: { type: "number", example: 350.0 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Inventory SKU registered and logged to ledger.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/InventoryItem",
                },
              },
            },
          },
          "400": {
            description: "Incomplete parameters.",
          },
        },
      },
    },
    "/api/purchase-orders": {
      get: {
        summary: "Get All Purchase Orders",
        description:
          "Retrieve complete purchasing history and status trackers.",
        responses: {
          "200": {
            description: "Success.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/PurchaseOrder",
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Raise a New Purchase Order",
        description:
          "Drafts and sends a procurement order, triggering an incoming carrier shipment automatically.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["supplierId", "items"],
                properties: {
                  supplierId: { type: "string", example: "sup-3" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["itemId", "quantity"],
                      properties: {
                        itemId: { type: "string", example: "inv-3" },
                        quantity: { type: "number", example: 5000 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Purchase Order created.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PurchaseOrder",
                },
              },
            },
          },
          "400": {
            description: "Invalid payload or unavailable items.",
          },
        },
      },
    },
    "/api/purchase-orders/{id}/receive": {
      post: {
        summary: "Receive a Purchase Order Delivery",
        description:
          "Triggers immediate inventory stock incrementation and marks the associated inbound cold-chain shipment as Delivered.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique Purchase Order ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "PO received successfully.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PurchaseOrder",
                },
              },
            },
          },
          "404": {
            description: "Purchase order id not found.",
          },
        },
      },
    },
    "/api/sales-orders": {
      get: {
        summary: "Get All Sales Orders",
        description: "Query client fulfillment and processing order flows.",
        responses: {
          "200": {
            description: "Success.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/SalesOrder",
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Generate an Outbound Sales Order",
        description:
          "Submits client request. Verifies inventory reserves before accepting draft status.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["customerName", "items"],
                properties: {
                  customerName: {
                    type: "string",
                    example: "Quantum Dynamics Ltd",
                  },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["itemId", "quantity"],
                      properties: {
                        itemId: { type: "string", example: "inv-2" },
                        quantity: { type: "number", example: 100 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Sales Order accepted and queued for processing.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SalesOrder",
                },
              },
            },
          },
          "400": {
            description: "Insufficient stock or invalid items.",
          },
        },
      },
    },
    "/api/sales-orders/{id}/dispatch": {
      post: {
        summary: "Dispatch Sales Order to Transit",
        description:
          "Deducts stock levels from the designated warehouse, launches an outbound IoT-tracked shipment with cold-chain protocols, and publishes hash logs to the ledger.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "The unique Sales Order ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Fulfillment transit launched successfully.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SalesOrder",
                },
              },
            },
          },
          "404": {
            description: "Sales Order ID not found.",
          },
        },
      },
    },
    "/api/sales-orders/{id}/complete": {
      post: {
        summary: "Complete Sales Order Delivery",
        description:
          "Marks sales order as completed and client-accepted, closing out active cold-chain sensory streams.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "The unique Sales Order ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Fulfillment completed.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SalesOrder",
                },
              },
            },
          },
          "404": {
            description: "Sales Order ID not found.",
          },
        },
      },
    },
    "/api/shipments": {
      get: {
        summary: "Track Active Shipments",
        description:
          "Fetches live logistics shipments, complete with current IoT environmental sensor values (Temp, Humidity, G-Force).",
        responses: {
          "200": {
            description: "Success.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Shipment",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/shipments/{id}/telemetry": {
      post: {
        summary: "Ingest IoT Sensory Telemetry",
        description:
          "Simulates direct sensory uploads from container tags. Automates tamper alerts and logistics safety-holds if thresholds are breached (e.g., Temp > 25°C or Impact G-Force > 1.8G).",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "The unique Shipment ID",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["temp", "humidity", "gForce"],
                properties: {
                  temp: {
                    type: "number",
                    example: 26.5,
                    description: "Degrees Celcius",
                  },
                  humidity: {
                    type: "number",
                    example: 48.0,
                    description: "Humidity Percentage %",
                  },
                  gForce: {
                    type: "number",
                    example: 1.1,
                    description: "Gravitational force impact rating",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Telemetry recorded and checked for threshold breaches.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Shipment",
                },
              },
            },
          },
          "404": {
            description: "Shipment ID not found.",
          },
        },
      },
    },
    "/api/blockchain": {
      get: {
        summary: "Fetch Decentralized Blockchain Logs",
        description:
          "Query complete list of secure blocks with SHA-256 hashes, backlink proof pointers, and cryptographic signatures.",
        responses: {
          "200": {
            description: "Blockchain logs returned.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/BlockchainBlock",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/blockchain/verify": {
      get: {
        summary: "Verify Cryptographic Blockchain Integrity",
        description:
          "Performs full mathematical checksum validation of every block's hash, verifies previous-block pointers, and confirms HMAC signatures. Highlights any tampering.",
        responses: {
          "200": {
            description: "Verification results.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    verified: { type: "boolean", example: true },
                    totalBlocks: { type: "number", example: 12 },
                    errors: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ai/predict-shortages": {
      get: {
        summary: "Run AI Stockout Risk Predictions",
        description:
          "Employs generative AI reasoning (with active RAG database context) to forecast stockout timescales, evaluate risk severity, and output procurement strategies.",
        responses: {
          "200": {
            description: "AI Predictions returned.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/PredictionResult",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/ai/chat": {
      post: {
        summary: "Interact with the Core SCM AI Agent",
        description:
          "Direct support conversational agent equipped with RAG context lookup and automated tool-calling integrations (like automated Sales Order dispatching).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: {
                    type: "string",
                    example:
                      "Analyze our inventory shortage and dispatch any pending sales orders.",
                  },
                  history: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: { type: "string" },
                      },
                    },
                  },
                  provider: {
                    type: "string",
                    enum: ["gemini", "openai", "ollama"],
                    example: "gemini",
                  },
                  apiKey: {
                    type: "string",
                    description: "Optional override API key.",
                  },
                  baseUrl: {
                    type: "string",
                    description:
                      "Optional local endpoint URL (e.g. for Ollama).",
                  },
                  modelName: { type: "string", example: "gemini-3.5-flash" },
                  ragEnabled: { type: "boolean", example: true },
                  toolsEnabled: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Conversation response.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    toolExecution: { type: "string" },
                    timestamp: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Supplier: {
        type: "object",
        properties: {
          id: { type: "string", example: "sup-1" },
          name: { type: "string", example: "Zenith Electronics Corp" },
          contactName: { type: "string", example: "Sarah Jenkins" },
          email: { type: "string", example: "sjenkins@zenithelectronics.com" },
          phone: { type: "string", example: "+1-555-0128" },
          location: { type: "string", example: "Silicon Valley, CA" },
          rating: { type: "number", example: 4.8 },
          status: {
            type: "string",
            enum: ["Active", "Inactive"],
            example: "Active",
          },
        },
      },
      Warehouse: {
        type: "object",
        properties: {
          id: { type: "string", example: "wh-1" },
          name: { type: "string", example: "Central Storage Hub Alpha" },
          location: { type: "string", example: "Chicago, IL" },
          capacity: { type: "number", example: 50000 },
          usedCapacity: { type: "number", example: 14200 },
          managerName: { type: "string", example: "Robert Carter" },
          status: {
            type: "string",
            enum: ["Active", "Maintenance"],
            example: "Active",
          },
        },
      },
      InventoryItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "inv-1" },
          name: { type: "string", example: "Quantum Processor Unit (QPU-x1)" },
          sku: { type: "string", example: "SKU-QPU-098" },
          category: { type: "string", example: "Processors" },
          quantity: { type: "number", example: 1200 },
          unit: { type: "string", example: "Units" },
          warehouseId: { type: "string", example: "wh-1" },
          supplierId: { type: "string", example: "sup-1" },
          reorderPoint: { type: "number", example: 500 },
          unitPrice: { type: "number", example: 350.0 },
        },
      },
      OrderItem: {
        type: "object",
        properties: {
          itemId: { type: "string", example: "inv-1" },
          name: { type: "string", example: "Quantum Processor Unit (QPU-x1)" },
          quantity: { type: "number", example: 1000 },
          price: { type: "number", example: 350.0 },
        },
      },
      PurchaseOrder: {
        type: "object",
        properties: {
          id: { type: "string", example: "po-1" },
          poNumber: { type: "string", example: "PO-2026-001" },
          supplierId: { type: "string", example: "sup-1" },
          supplierName: { type: "string", example: "Zenith Electronics Corp" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" },
          },
          totalAmount: { type: "number", example: 350000.0 },
          status: {
            type: "string",
            enum: ["Draft", "Sent", "Received", "Cancelled"],
            example: "Received",
          },
          orderDate: { type: "string", format: "date-time" },
          expectedDeliveryDate: { type: "string", format: "date-time" },
        },
      },
      SalesOrder: {
        type: "object",
        properties: {
          id: { type: "string", example: "so-1" },
          soNumber: { type: "string", example: "SO-2026-001" },
          customerName: { type: "string", example: "MegaTech Systems Inc" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/OrderItem" },
          },
          totalAmount: { type: "number", example: 100000.0 },
          status: {
            type: "string",
            enum: ["Draft", "Processing", "Shipped", "Completed", "Cancelled"],
            example: "Completed",
          },
          orderDate: { type: "string", format: "date-time" },
        },
      },
      SensorReading: {
        type: "object",
        properties: {
          timestamp: { type: "string", format: "date-time" },
          temp: { type: "number", example: 18.5 },
          humidity: { type: "number", example: 44.1 },
          gForce: { type: "number", example: 1.0 },
        },
      },
      Shipment: {
        type: "object",
        properties: {
          id: { type: "string", example: "ship-1" },
          shipmentNumber: { type: "string", example: "SH-2026-101" },
          orderId: { type: "string", example: "po-2" },
          orderNumber: { type: "string", example: "PO-2026-002" },
          orderType: {
            type: "string",
            enum: ["Purchase", "Sales"],
            example: "Purchase",
          },
          origin: { type: "string", example: "Tokyo, Japan" },
          destination: {
            type: "string",
            example: "Chicago, IL (Central Storage Hub Alpha)",
          },
          carrier: { type: "string", example: "Pacific Cargo Express" },
          trackingNumber: { type: "string", example: "TRK-PAC-991203" },
          status: {
            type: "string",
            enum: ["Pending", "In Transit", "Delivered", "Delayed"],
            example: "In Transit",
          },
          currentTemp: { type: "number", example: 19.4 },
          currentHumidity: { type: "number", example: 45.2 },
          currentGForce: { type: "number", example: 1.02 },
          sensorHistory: {
            type: "array",
            items: { $ref: "#/components/schemas/SensorReading" },
          },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      BlockchainBlock: {
        type: "object",
        properties: {
          index: { type: "number", example: 1 },
          timestamp: { type: "string", format: "date-time" },
          data: {
            type: "object",
            properties: {
              action: { type: "string", example: "SUPPLIER_REGISTERED" },
              entityId: { type: "string", example: "sup-1" },
              entityType: { type: "string", example: "Supplier" },
              details: {
                type: "string",
                example:
                  "Zenith Electronics Corp registered on decentralized trust logs.",
              },
              operator: { type: "string", example: "MARK_VANCE" },
              trackingCode: { type: "string" },
            },
          },
          previousHash: { type: "string", example: "167bf...ae98" },
          hash: { type: "string", example: "e93da...bb81" },
          signature: { type: "string", example: "0x89ab...bc34" },
        },
      },
      PredictionResult: {
        type: "object",
        properties: {
          itemId: { type: "string", example: "inv-2" },
          itemName: { type: "string", example: "Advanced Laser Probe (ALP-4)" },
          sku: { type: "string", example: "SKU-ALP-114" },
          currentQuantity: { type: "number", example: 350 },
          predictedDaysToStockout: { type: "number", example: 3 },
          recommendedAction: {
            type: "string",
            example:
              "Procure 1,500 units from active supplier immediately to restore safety buffer.",
          },
          confidence: { type: "number", example: 85 },
        },
      },
    },
  },
};
