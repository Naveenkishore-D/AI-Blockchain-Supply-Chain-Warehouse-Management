import { Supplier, Customer, Warehouse, InventoryItem, BlockchainBlock } from '../types';

export const FALLBACK_SUPPLIERS: Supplier[] = [
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
    contactName: 'Elena Rostova',
    email: 'e.rostova@globalparts.com',
    phone: '+1-555-0842',
    location: 'Munich, Germany',
    rating: 4.9,
    status: 'Active'
  }
];

export const FALLBACK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Omni Retail Enterprises',
    contactName: 'David Kim',
    email: 'dkim@omniretail.com',
    phone: '+1-555-0349',
    location: 'Springfield, OR',
    status: 'Active',
    totalOrdersCount: 14
  },
  {
    id: 'cust-2',
    name: 'Starlight Medical Supplies',
    contactName: 'Dr. Rebecca Moore',
    email: 'rmoore@starlightmed.org',
    phone: '+1-555-0912',
    location: 'Boston, MA',
    status: 'Active',
    totalOrdersCount: 8
  }
];

export const FALLBACK_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    name: 'Oakland Primary Logistics Hub',
    location: 'Oakland, CA',
    city: 'Oakland',
    state: 'CA',
    country: 'USA',
    capacity: 50000,
    usedCapacity: 34200,
    managerName: 'Robert Lang',
    status: 'Active'
  },
  {
    id: 'wh-2',
    name: 'Dallas Distribution Depot',
    location: 'Dallas, TX',
    city: 'Dallas',
    state: 'TX',
    country: 'USA',
    capacity: 75000,
    usedCapacity: 61000,
    managerName: 'Alicia Gomez',
    status: 'Active'
  },
  {
    id: 'wh-3',
    name: 'Rotterdam Cold Storage Gateway',
    location: 'Rotterdam, Netherlands',
    city: 'Rotterdam',
    country: 'Netherlands',
    capacity: 30000,
    usedCapacity: 14500,
    managerName: 'Jan de Jong',
    status: 'Active'
  }
];

export const FALLBACK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'NEX-MICRO-001',
    name: 'AI Neural Accelerator SOC',
    category: 'Semiconductors',
    quantity: 1450,
    unit: 'pcs',
    reorderPoint: 300,
    unitPrice: 85.00,
    warehouseId: 'wh-1',
    supplierId: 'sup-1',
    barcode: '8901234567890',
    batchNumber: 'BATCH-2026-001',
    expiryDate: '2028-12-31'
  },
  {
    id: 'inv-2',
    sku: 'NEX-SENSOR-042',
    name: 'Cryogenic IoT Temperature Sensor',
    category: 'Sensors',
    quantity: 180,
    unit: 'units',
    reorderPoint: 200,
    unitPrice: 42.50,
    warehouseId: 'wh-3',
    supplierId: 'sup-2',
    barcode: '8901234567891',
    batchNumber: 'BATCH-2026-002',
    expiryDate: '2027-06-30'
  },
  {
    id: 'inv-3',
    sku: 'NEX-CELL-99',
    name: 'High-Density Graphene Power Cell',
    category: 'Energy',
    quantity: 3200,
    unit: 'modules',
    reorderPoint: 500,
    unitPrice: 120.00,
    warehouseId: 'wh-2',
    supplierId: 'sup-3',
    barcode: '8901234567892',
    batchNumber: 'BATCH-2026-003',
    expiryDate: '2030-01-01'
  }
];

export const FALLBACK_BLOCKCHAIN: BlockchainBlock[] = [
  {
    index: 0,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    data: {
      action: 'GENESIS',
      entityId: 'NEXUS-SCM-ROOT',
      entityType: 'System',
      details: 'Enterprise Supply Chain & Warehouse Cryptographic Ledger Initialized',
      operator: 'SYSTEM_GENESIS_AGENT'
    },
    previousHash: '0'.repeat(64),
    hash: '0000a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef123456',
    signature: '0x8f2d93e41b2a5c6d7e8f90123456789abcdef012'
  },
  {
    index: 1,
    timestamp: new Date().toISOString(),
    data: {
      action: 'DISPATCH',
      entityId: 'SHP-9021',
      entityType: 'Shipment',
      details: 'Cold-chain dispatch recorded with IoT GPS telemetry',
      operator: 'admin@nexus-scm.com',
      trackingCode: 'IOT-8842-GPS'
    },
    previousHash: '0000a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef123456',
    hash: 'c4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    signature: '0x3a4b5c6d7e8f90123456789abcdef0123456789a'
  }
];
