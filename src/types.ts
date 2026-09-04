export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  rating: number;
  status: 'Active' | 'Inactive';
}

export interface Customer {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  location: string;
  status: 'Active' | 'Inactive';
  totalOrdersCount: number;
}

export interface Warehouse {
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  id: string;
  name: string;
  location: string;
  capacity: number; // in units
  usedCapacity: number; // in units
  managerName: string;
  status: 'Active' | 'Maintenance';
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  warehouseId: string;
  supplierId: string;
  reorderPoint: number;
  unitPrice: number;
  barcode: string;
  batchNumber: string;
  expiryDate: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid';
  invoiceId?: string;
  orderDate: string;
  expectedDeliveryDate: string;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Draft' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid';
  invoiceId?: string;
  orderDate: string;
}

export interface SensorReading {
  timestamp: string;
  temp: number;
  humidity: number;
  gForce: number;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderId: string; // PO or SO ID
  orderNumber: string;
  orderType: 'Purchase' | 'Sales';
  origin: string;
  destination: string;
  carrier: string;
  trackingNumber: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Delayed';
  currentTemp: number;
  currentHumidity: number;
  currentGForce: number;
  sensorHistory: SensorReading[];
  updatedAt: string;
}

export interface BlockchainBlock {
  id?: number;
  index: number;
  timestamp: string;
  data: {
    action: string;
    entityId: string;
    entityType: 'Shipment' | 'Inventory' | 'Order' | 'Supplier' | string;
    details: string;
    operator: string;
    trackingCode?: string;
  };
  previousHash: string;
  hash: string;
  signature: string;
  ethTxHash?: string;
  ethContractAddress?: string;
  ethBlockNumber?: string;
  ethNetwork?: string;
  ethStatus?: string;
}

export interface PredictionResult {
  itemId: string;
  itemName: string;
  sku: string;
  currentQuantity: number;
  predictedDaysToStockout: number;
  recommendedAction: string;
  confidence: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | string;
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: string;
  operator: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
