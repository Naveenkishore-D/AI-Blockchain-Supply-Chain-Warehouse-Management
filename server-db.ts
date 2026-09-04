import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { 
  Supplier, 
  Customer, 
  Warehouse, 
  InventoryItem, 
  PurchaseOrder, 
  SalesOrder, 
  Shipment, 
  BlockchainBlock, 
  StockMovement 
} from './src/types';

// ============================================================================
// 1. MYSQL CONNECTION POOL SETUP
// ============================================================================

let mysqlPool: Pool | null = null;

/**
 * Returns a singleton MySQL connection pool configured with environment variables.
 * Uses lazy initialization so missing credentials or unreachable servers fail gracefully.
 */
export function getMySQLPool(): Pool {
  if (!mysqlPool) {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'nexus_scm_db';

    mysqlPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: 'utf8mb4'
    });

    console.log(`[MySQL Pool] Initialized connection pool for ${user}@${host}:${port}/${database}`);
  }
  return mysqlPool;
}

/**
 * Test connectivity to the MySQL database
 */
export async function testMySQLConnection(): Promise<boolean> {
  try {
    const pool = getMySQLPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('[MySQL Pool] Database ping successful');
    return true;
  } catch (err: any) {
    console.warn(`[MySQL Pool] Unable to connect to MySQL (${err.message}). Make sure MySQL is running and credentials in .env are correct.`);
    return false;
  }
}

/**
 * Helper to run parameterized SELECT queries returning rows
 */
export async function query<T extends RowDataPacket[]>(sql: string, params: any[] = []): Promise<T> {
  const pool = getMySQLPool();
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
}

/**
 * Helper to run INSERT, UPDATE, DELETE queries returning ResultSetHeader
 */
export async function execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
  const pool = getMySQLPool();
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

// ============================================================================
// 2. MYSQL SCHEMA DEFINITIONS (DDL)
// Differences from SQLite:
// - AUTO_INCREMENT instead of AUTOINCREMENT
// - VARCHAR(255) / TEXT instead of unbounded TEXT
// - INT / DECIMAL(10,2) / TINYINT(1) for boolean
// - JSON native column type
// - DATETIME DEFAULT CURRENT_TIMESTAMP
// ============================================================================

export const MYSQL_SCHEMA_QUERIES = [
  // Users Table
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'WAREHOUSE_MANAGER', 'SUPPLIER', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    status ENUM('ACTIVE', 'PENDING', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    company VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Suppliers Table
  `CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    rating DECIMAL(3, 2) DEFAULT 5.00,
    status VARCHAR(50) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Customers Table
  `CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    total_orders_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Warehouses Table
  `CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),
    capacity INT NOT NULL DEFAULT 50000,
    used_capacity INT NOT NULL DEFAULT 0,
    manager_name VARCHAR(150),
    status VARCHAR(50) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Inventory Items Table
  `CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'Units',
    warehouse_id VARCHAR(50),
    supplier_id VARCHAR(50),
    reorder_point INT DEFAULT 100,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    barcode VARCHAR(100),
    batch_number VARCHAR(100),
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_warehouse (warehouse_id),
    INDEX idx_supplier (supplier_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Purchase Orders Table
  `CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(50) PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_id VARCHAR(50) NOT NULL,
    items JSON NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Draft', 'Submitted', 'Approved', 'Shipped', 'Received', 'Cancelled') NOT NULL DEFAULT 'Draft',
    order_date DATETIME NOT NULL,
    expected_delivery_date DATETIME,
    blockchain_hash VARCHAR(66),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Sales Orders Table
  `CREATE TABLE IF NOT EXISTS sales_orders (
    id VARCHAR(50) PRIMARY KEY,
    so_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id VARCHAR(50) NOT NULL,
    items JSON NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Draft', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Draft',
    order_date DATETIME NOT NULL,
    blockchain_hash VARCHAR(66),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Shipments Table
  `CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(50) PRIMARY KEY,
    tracking_number VARCHAR(100) NOT NULL UNIQUE,
    order_id VARCHAR(50) NOT NULL,
    order_type ENUM('PurchaseOrder', 'SalesOrder') NOT NULL,
    carrier VARCHAR(100) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status ENUM('Pending', 'InTransit', 'CustomsHold', 'OutForDelivery', 'Delivered', 'Delayed') NOT NULL DEFAULT 'Pending',
    estimated_arrival DATETIME,
    current_location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    blockchain_hash VARCHAR(66),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Immutable Blockchain Ledger Table
  `CREATE TABLE IF NOT EXISTS blockchain_blocks (
    \`index\` INT PRIMARY KEY,
    timestamp VARCHAR(50) NOT NULL,
    data JSON NOT NULL,
    previous_hash VARCHAR(66) NOT NULL,
    hash VARCHAR(66) NOT NULL,
    signature VARCHAR(66) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

  // Stock Movements Audit Table
  `CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(50) PRIMARY KEY,
    inventory_id VARCHAR(50) NOT NULL,
    type ENUM('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT') NOT NULL,
    quantity INT NOT NULL,
    from_warehouse_id VARCHAR(50),
    to_warehouse_id VARCHAR(50),
    reason VARCHAR(255),
    operator VARCHAR(100) NOT NULL,
    timestamp VARCHAR(50) NOT NULL,
    blockchain_hash VARCHAR(66),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
];

/**
 * Initializes the MySQL schema by executing all DDL statements
 */
export async function initMySQLSchema(): Promise<void> {
  const pool = getMySQLPool();
  for (const statement of MYSQL_SCHEMA_QUERIES) {
    await pool.query(statement);
  }
  console.log('[MySQL Schema] All 10 tables initialized successfully in MySQL.');
}

// ============================================================================
// 3. CRYPTOGRAPHIC LEDGER HELPERS
// ============================================================================

export function calculateBlockHash(index: number, timestamp: string, data: any, previousHash: string): string {
  const dataStr = JSON.stringify(data);
  return crypto
    .createHash('sha256')
    .update(`${index}${timestamp}${dataStr}${previousHash}`)
    .digest('hex');
}

export function generateBlockSignature(hash: string): string {
  return '0x' + crypto.createHmac('sha256', 'enterprise-ledger-secret-key-2026').update(hash).digest('hex').substring(0, 40);
}

// ============================================================================
// 4. LOCAL FALLBACK / HYBRID STORE
// Ensures the application remains fully functional if external MySQL is offline
// ============================================================================

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'data-store.json')
  : path.join(process.cwd(), 'data-store.json');

export interface DBState {
  suppliers: Supplier[];
  customers: Customer[];
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  shipments: Shipment[];
  blockchain: BlockchainBlock[];
  stockMovements: StockMovement[];
  users: any[];
}

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Zenith Electronics Corp',
    contactName: 'Sarah Jenkins',
    email: 'sjenkins@zenithelectronics.com',
    phone: '+1-555-0128',
    location: 'Silicon Valley, CA',
    rating: 4.8,
    status: 'Active'
  },
  {
    id: 'sup-2',
    name: 'Apex Logistics & Tech',
    contactName: 'Marcus Vance',
    email: 'm.vance@apexlogistics.com',
    phone: '+1-555-0199',
    location: 'Chicago, IL',
    rating: 4.5,
    status: 'Active'
  },
  {
    id: 'sup-3',
    name: 'Global Parts Manufacturing',
    contactName: 'Kenji Sato',
    email: 'k.sato@globalparts.co.jp',
    phone: '+81-3-5555-0144',
    location: 'Tokyo, Japan',
    rating: 4.2,
    status: 'Active'
  }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'MegaTech Systems Inc',
    contactName: 'Amanda Ross',
    email: 'aross@megatech.com',
    phone: '+1-555-0147',
    location: 'Austin, TX',
    status: 'Active',
    totalOrdersCount: 24
  },
  {
    id: 'cust-2',
    name: 'Quantum Dynamics Ltd',
    contactName: 'Brian Foster',
    email: 'bfoster@quantumdynamics.io',
    phone: '+1-555-0182',
    location: 'Seattle, WA',
    status: 'Active',
    totalOrdersCount: 12
  },
  {
    id: 'cust-3',
    name: 'AeroSpace Solutions Group',
    contactName: 'Cynthia Patel',
    email: 'cpatel@aerospacesolutions.com',
    phone: '+1-555-0291',
    location: 'Denver, CO',
    status: 'Active',
    totalOrdersCount: 8
  }
];

const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    name: 'Chennai Central Warehouse',
    location: 'Chennai, Tamil Nadu, India',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    pincode: '600001',
    capacity: 50000,
    usedCapacity: 14200,
    managerName: 'Arun Kumar',
    status: 'Active'
  },
  {
    id: 'wh-2',
    name: 'Coimbatore Logistics Hub',
    location: 'Coimbatore, Tamil Nadu, India',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    pincode: '641001',
    capacity: 35000,
    usedCapacity: 6100,
    managerName: 'Priya Rajan',
    status: 'Active'
  },
  {
    id: 'wh-3',
    name: 'Bangalore Tech Warehouse',
    location: 'Bangalore, Karnataka, India',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    capacity: 60000,
    usedCapacity: 45000,
    managerName: 'Ramesh Reddy',
    status: 'Active'
  }
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Quantum Processor Unit (QPU-x1)',
    sku: 'SKU-QPU-098',
    category: 'Processors',
    quantity: 1200,
    unit: 'Units',
    warehouseId: 'wh-1',
    supplierId: 'sup-1',
    reorderPoint: 500,
    unitPrice: 350.00,
    barcode: 'BC-001',
    batchNumber: 'B-001',
    expiryDate: '2026-12-31'
  },
  {
    id: 'inv-2',
    name: 'Advanced Laser Probe (ALP-4)',
    sku: 'SKU-ALP-114',
    category: 'Sensors',
    quantity: 350,
    unit: 'Units',
    warehouseId: 'wh-1',
    supplierId: 'sup-1',
    reorderPoint: 400,
    unitPrice: 125.00,
    barcode: 'BC-002',
    batchNumber: 'B-002',
    expiryDate: '2026-10-31'
  }
];

function generateGenesisChain(): BlockchainBlock[] {
  const genesisTimestamp = '2026-01-01T00:00:00.000Z';
  const genesisData = {
    action: 'GENESIS_INITIALIZATION',
    entityId: 'CHAIN-ROOT-000',
    entityType: 'SystemRoot',
    details: 'Nexus Supply Chain Management Quantum Ledger Root Block Initialized',
    operator: 'SYSTEM_ROOT',
    hashData: '0x00000000000000000000000000000000'
  };
  const genesisHash = calculateBlockHash(0, genesisTimestamp, genesisData, '0'.repeat(64));
  return [
    {
      index: 0,
      timestamp: genesisTimestamp,
      data: genesisData,
      previousHash: '0'.repeat(64),
      hash: genesisHash,
      signature: generateBlockSignature(genesisHash)
    }
  ];
}

let inMemoryDB: DBState | null = null;

const DEFAULT_USERS: any[] = [
  { id: 1, username: 'admin', email: 'admin@nexus-scm.com', password: 'adminPassword', role: 'ADMIN', status: 'ACTIVE' },
  { id: 2, username: 'manager', email: 'manager@nexus-scm.com', password: 'managerPassword', role: 'WAREHOUSE_MANAGER', status: 'ACTIVE' },
  { id: 3, username: 'supervisor', email: 'supervisor@nexus-scm.com', password: 'supervisorPassword', role: 'INVENTORY_SUPERVISOR', status: 'ACTIVE' },
  { id: 4, username: 'operator', email: 'operator@nexus-scm.com', password: 'operatorPassword', role: 'LOGISTICS_OPERATOR', status: 'ACTIVE' },
  { id: 5, username: 'auditor', email: 'auditor@nexus-scm.com', password: 'auditorPassword', role: 'COMPLIANCE_AUDITOR', status: 'ACTIVE' },
  { id: 6, username: 'dispatch', email: 'dispatch@nexus-scm.com', password: 'deliveryPassword', role: 'Delivery Partner', status: 'ACTIVE' },
  { id: 7, username: 'pending_user', email: 'pending@nexus-scm.com', password: 'pendingPassword', role: 'WAREHOUSE_MANAGER', status: 'PENDING' },
  { id: 8, username: 'blocked_user', email: 'blocked@nexus-scm.com', password: 'blockedPassword', role: 'CUSTOMER', status: 'BLOCKED' },
  { id: 9, username: 'naveenkishore2929', fullName: 'Naveen', email: 'naveenkishore2929@gmail.com', phone: '789', password: '$2b$10$d0QuZX/SyjYDaCTqW0TOF.eSg3Fl3QikNPs1D/w8Mm2rKcMoIQ5qu', role: 'WAREHOUSE_MANAGER', company: 'abc', status: 'ACTIVE' },
  { id: 10, username: 'admin', email: 'admin@nexus-scm.com', password: 'adminPassword', role: 'ADMIN', status: 'ACTIVE' },
  { id: 11, username: 'supplier_1', fullName: 'Supplier', email: 'supplier@gmail.com', phone: '789', password: '$2b$10$ikjYdnrDf7rHb.bWAzObj.pZuI1pcA8kehPJ3.tIT6e3lXf7Okz/a', role: 'SUPPLIER', company: 'ABc', status: 'ACTIVE' },
  { id: 12, username: 'customer_1', fullName: 'customer', email: 'customer@gmail.com', phone: '4678', password: '$2b$10$0LpWVWoycHFIKGOiOckoVO0PJNwQdt9NLQl.TbBKxufeXCG6qKkHm', role: 'CUSTOMER', company: 'abc', status: 'ACTIVE' }
];

export function loadDB(): DBState {
  if (inMemoryDB) {
    return inMemoryDB;
  }

  // Candidate file paths to look for data-store.json
  const candidatePaths = [
    DB_PATH,
    path.join(process.cwd(), 'data-store.json')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        if (!data.users || data.users.length === 0) {
          data.users = DEFAULT_USERS;
        }
        inMemoryDB = data;
        
        // If on Vercel and DB_PATH (/tmp/...) is different from the source, copy it
        if (process.env.VERCEL && p !== DB_PATH && !fs.existsSync(DB_PATH)) {
          try {
            fs.writeFileSync(DB_PATH, raw, 'utf-8');
          } catch (copyErr) {
            console.warn("Could not copy data-store to /tmp:", copyErr);
          }
        }
        return inMemoryDB!;
      } catch (readErr) {
        console.warn(`Could not read data from ${p}:`, readErr);
      }
    }
  }

  // Fallback initial state if no data file could be found/read
  const state: DBState = {
    suppliers: DEFAULT_SUPPLIERS,
    customers: DEFAULT_CUSTOMERS,
    warehouses: DEFAULT_WAREHOUSES,
    inventory: DEFAULT_INVENTORY,
    purchaseOrders: [],
    salesOrders: [],
    shipments: [],
    blockchain: generateGenesisChain(),
    stockMovements: [],
    users: DEFAULT_USERS
  };
  
  inMemoryDB = state;
  saveDB(state);
  return state;
}

export function saveDB(state: DBState) {
  inMemoryDB = state;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.warn("Could not persist data file to disk (continuing with in-memory state):", e);
  }
}

export function addBlockchainBlock(
  state: DBState, 
  action: string, 
  entityId: string, 
  entityType: 'Shipment' | 'Inventory' | 'Order' | 'Supplier' | 'Customer' | string, 
  details: string, 
  operator: string,
  hashData: string
): BlockchainBlock {
  const previousBlock = state.blockchain[state.blockchain.length - 1];
  const index = previousBlock.index + 1;
  const timestamp = new Date().toISOString();
  
  const data = {
    action,
    entityId,
    entityType,
    details,
    operator,
    hashData
  };

  const hash = calculateBlockHash(index, timestamp, data, previousBlock.hash);
  const signature = generateBlockSignature(hash);

  const newBlock: BlockchainBlock = {
    index,
    timestamp,
    data,
    previousHash: previousBlock.hash,
    hash,
    signature
  };

  state.blockchain.push(newBlock);
  saveDB(state);
  return newBlock;
}
