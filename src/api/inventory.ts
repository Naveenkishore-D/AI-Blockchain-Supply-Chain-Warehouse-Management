import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loadDB, saveDB, addBlockchainBlock } from '../../server-db';
import { InventoryItem, StockMovement } from '../types';

const router = Router();

// Validation Schema using Zod
const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  warehouseId: z.string().min(1, "Warehouse ID is required"),
  supplierId: z.string().min(1, "Supplier ID is required"),
  reorderPoint: z.coerce.number().min(0, "Reorder point must be positive"),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
  barcode: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional()
});

// Helper to record stock movement
function recordStockMovement(
  db: any,
  item: InventoryItem,
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | string,
  quantityChanged: number,
  previousQuantity: number,
  newQuantity: number,
  reason: string,
  operator: string
) {
  if (!db.stockMovements) {
    db.stockMovements = [];
  }
  const movement: StockMovement = {
    id: 'mov-' + Math.random().toString(36).substring(2, 9),
    itemId: item.id,
    itemName: item.name,
    sku: item.sku,
    type,
    quantityChanged,
    previousQuantity,
    newQuantity,
    reason,
    timestamp: new Date().toISOString(),
    operator
  };
  db.stockMovements.push(movement);

  // also add a blockchain block for trace-log integrity
  addBlockchainBlock(
    db,
    `STOCK_${type.toUpperCase()}`,
    item.id,
    'Inventory',
    `Stock changed: ${item.name} (${item.sku}) - ${type} of ${quantityChanged} units. Reason: ${reason}`,
    operator,
    `${item.sku} Prev:${previousQuantity} New:${newQuantity}`
  );
}

// GET all with Filtering, Sorting, and Pagination
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = loadDB();
    let data = [...db.inventory];

    // 1. Filtering
    const { category, search, minPrice, maxPrice } = req.query;
    if (category) {
      data = data.filter(item => item.category === category);
    }
    if (search) {
      const searchStr = String(search).toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchStr) || 
        item.sku.toLowerCase().includes(searchStr)
      );
    }
    if (minPrice) {
      data = data.filter(item => item.unitPrice >= Number(minPrice));
    }
    if (maxPrice) {
      data = data.filter(item => item.unitPrice <= Number(maxPrice));
    }

    // 2. Sorting
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? -1 : 1;
    
    data.sort((a: any, b: any) => {
      if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
      if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
      return 0;
    });

    // 3. Pagination (only if requested, default to all)
    if (req.query.page || req.query.limit) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const results = data.slice(startIndex, endIndex);

      res.json({
        total: data.length,
        page,
        limit,
        totalPages: Math.ceil(data.length / limit),
        data: results
      });
      return;
    }

    // Default to sending full list
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET global stock movements history
router.get('/movements', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = loadDB();
    res.json(db.stockMovements || []);
  } catch (error) {
    next(error);
  }
});

// GET single item
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = loadDB();
    const item = db.inventory.find(i => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST new item with Validation
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validation
    const validatedData = inventorySchema.parse(req.body);
    const db = loadDB();
    
    // Check if SKU exists
    if (db.inventory.some(i => i.sku.toLowerCase() === validatedData.sku.toLowerCase())) {
      res.status(400).json({ error: `SKU '${validatedData.sku}' already exists` });
      return;
    }

    const newInventory: InventoryItem = {
      id: 'inv-' + Math.random().toString(36).substring(2, 9),
      ...validatedData,
      barcode: validatedData.barcode || `BC-${validatedData.sku}`,
      batchNumber: validatedData.batchNumber || `BCH-${new Date().getFullYear()}`,
      expiryDate: validatedData.expiryDate || ''
    };

    // Update warehouse capacity
    const warehouse = db.warehouses.find(w => w.id === newInventory.warehouseId);
    if (warehouse) {
      warehouse.usedCapacity += newInventory.quantity;
    }

    db.inventory.push(newInventory);

    // Initial stock movement logging
    const operator = (req as any).user?.username || 'SYSTEM_ADMIN';
    recordStockMovement(db, newInventory, 'STOCK_IN', newInventory.quantity, 0, newInventory.quantity, 'Product Initialization', operator);

    saveDB(db);
    res.status(201).json(newInventory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      next(error);
    }
  }
});

// PUT update item with Validation
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = inventorySchema.partial().parse(req.body);
    const db = loadDB();
    
    const index = db.inventory.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    const currentItem = db.inventory[index];

    // Check SKU uniqueness if changed
    if (validatedData.sku && validatedData.sku.toLowerCase() !== currentItem.sku.toLowerCase()) {
      if (db.inventory.some(i => i.id !== req.params.id && i.sku.toLowerCase() === validatedData.sku!.toLowerCase())) {
        res.status(400).json({ error: `SKU '${validatedData.sku}' already exists on another product` });
        return;
      }
    }

    // Verify quantity cannot be negative
    if (validatedData.quantity !== undefined && validatedData.quantity < 0) {
      res.status(400).json({ error: 'Quantity cannot be negative' });
      return;
    }

    const previousQuantity = currentItem.quantity;
    const previousWarehouseId = currentItem.warehouseId;

    // Apply edits
    const updatedItem = { ...currentItem, ...validatedData };
    db.inventory[index] = updatedItem;

    // Handle warehouse capacity adjustments if warehouse or quantity changes
    if (validatedData.warehouseId !== undefined || validatedData.quantity !== undefined) {
      const targetQty = validatedData.quantity !== undefined ? validatedData.quantity : previousQuantity;
      const targetWHId = validatedData.warehouseId !== undefined ? validatedData.warehouseId : previousWarehouseId;

      // Deduct from previous warehouse
      const prevWH = db.warehouses.find(w => w.id === previousWarehouseId);
      if (prevWH) {
        prevWH.usedCapacity = Math.max(0, prevWH.usedCapacity - previousQuantity);
      }
      // Add to new/target warehouse
      const targetWH = db.warehouses.find(w => w.id === targetWHId);
      if (targetWH) {
        targetWH.usedCapacity += targetQty;
      }
    }

    // Record stock movement if quantity changed
    const operator = (req as any).user?.username || 'SYSTEM_ADMIN';
    if (validatedData.quantity !== undefined && validatedData.quantity !== previousQuantity) {
      const difference = validatedData.quantity - previousQuantity;
      const movementType = difference > 0 ? 'STOCK_IN' : 'STOCK_OUT';
      recordStockMovement(db, updatedItem, movementType, difference, previousQuantity, validatedData.quantity, 'Manual Edit Adjustment', operator);
    } else {
      // Just normal update blockchain logging
      addBlockchainBlock(
        db,
        'INVENTORY_UPDATED',
        req.params.id,
        'Inventory',
        `Inventory item '${updatedItem.name}' metadata updated.`,
        operator,
        `Fields: ${Object.keys(validatedData).join(', ')}`
      );
    }

    saveDB(db);
    res.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      next(error);
    }
  }
});

// POST Stock-In
router.post('/:id/stock-in', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, reason } = req.body;
    const changeQty = Number(quantity);
    if (isNaN(changeQty) || changeQty <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive number' });
      return;
    }

    const db = loadDB();
    const item = db.inventory.find(i => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    const previousQuantity = item.quantity;
    const newQuantity = previousQuantity + changeQty;
    item.quantity = newQuantity;

    // Update warehouse capacity
    const warehouse = db.warehouses.find(w => w.id === item.warehouseId);
    if (warehouse) {
      warehouse.usedCapacity += changeQty;
    }

    const operator = (req as any).user?.username || 'SYSTEM_ADMIN';
    recordStockMovement(db, item, 'STOCK_IN', changeQty, previousQuantity, newQuantity, reason || 'Stock In', operator);

    saveDB(db);
    res.json({ item, message: 'Stock checked in successfully' });
  } catch (error) {
    next(error);
  }
});

// POST Stock-Out
router.post('/:id/stock-out', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, reason } = req.body;
    const changeQty = Number(quantity);
    if (isNaN(changeQty) || changeQty <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive number' });
      return;
    }

    const db = loadDB();
    const item = db.inventory.find(i => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    const previousQuantity = item.quantity;
    if (previousQuantity - changeQty < 0) {
      res.status(400).json({ error: 'Insufficient stock. Quantity cannot be negative.' });
      return;
    }

    const newQuantity = previousQuantity - changeQty;
    item.quantity = newQuantity;

    // Update warehouse capacity
    const warehouse = db.warehouses.find(w => w.id === item.warehouseId);
    if (warehouse) {
      warehouse.usedCapacity = Math.max(0, warehouse.usedCapacity - changeQty);
    }

    const operator = (req as any).user?.username || 'SYSTEM_ADMIN';
    recordStockMovement(db, item, 'STOCK_OUT', -changeQty, previousQuantity, newQuantity, reason || 'Stock Out', operator);

    saveDB(db);
    res.json({ item, message: 'Stock checked out successfully' });
  } catch (error) {
    next(error);
  }
});

// POST Stock Adjustment
router.post('/:id/stock-adjustment', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, reason } = req.body;
    const targetQty = Number(quantity);
    if (isNaN(targetQty) || targetQty < 0) {
      res.status(400).json({ error: 'Quantity cannot be negative.' });
      return;
    }

    const db = loadDB();
    const item = db.inventory.find(i => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    const previousQuantity = item.quantity;
    const difference = targetQty - previousQuantity;
    item.quantity = targetQty;

    // Update warehouse capacity
    const warehouse = db.warehouses.find(w => w.id === item.warehouseId);
    if (warehouse) {
      warehouse.usedCapacity += difference;
    }

    const operator = (req as any).user?.username || 'SYSTEM_ADMIN';
    recordStockMovement(db, item, 'ADJUSTMENT', difference, previousQuantity, targetQty, reason || 'Inventory Audit Adjustment', operator);

    saveDB(db);
    res.json({ item, message: 'Stock adjusted successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE item
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = loadDB();
    const index = db.inventory.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Inventory item not found' });
      return;
    }

    const item = db.inventory[index];
    db.inventory.splice(index, 1);

    // Update warehouse capacity
    const warehouse = db.warehouses.find(w => w.id === item.warehouseId);
    if (warehouse) {
      warehouse.usedCapacity = Math.max(0, warehouse.usedCapacity - item.quantity);
    }

    addBlockchainBlock(
      db,
      'INVENTORY_DELETED',
      req.params.id,
      'Inventory',
      `Inventory item '${item.name}' was removed.`,
      (req as any).user?.username || 'SYSTEM_ADMIN',
      `${item.sku} Removed`
    );

    saveDB(db);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
