import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loadDB, saveDB, addBlockchainBlock } from '../../server-db.js';
import { Supplier } from '../types.js';

const router = Router();

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().min(1, "Contact Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(1, "Phone is required"),
  location: z.string().min(1, "Location is required"),
  rating: z.coerce.number().min(0).max(5).default(0),
  status: z.enum(['Active', 'Inactive']).default('Active')
});

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = loadDB();
    let data = [...db.suppliers];

    // Filtering
    const { status, search } = req.query;
    if (status) {
      data = data.filter(item => item.status === status);
    }
    if (search) {
      const searchStr = String(search).toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchStr) || 
        item.email.toLowerCase().includes(searchStr)
      );
    }

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as string) === 'desc' ? -1 : 1;
    
    data.sort((a: any, b: any) => {
      if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
      if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
      return 0;
    });

    // Pagination
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
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = loadDB();
    const item = db.suppliers.find(i => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = supplierSchema.parse(req.body);
    const db = loadDB();

    const newSupplier: Supplier = {
      id: 'sup-' + Math.random().toString(36).substring(2, 9),
      ...validatedData
    };

    db.suppliers.push(newSupplier);

    addBlockchainBlock(
      db,
      'SUPPLIER_REGISTERED',
      newSupplier.id,
      'Supplier',
      `${newSupplier.name} registered.`,
      'OPERATOR_ADMIN',
      `${newSupplier.name} ${newSupplier.location}`
    );

    saveDB(db);
    res.status(201).json(newSupplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      next(error);
    }
  }
});

router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = supplierSchema.partial().parse(req.body);
    const db = loadDB();
    
    const index = db.suppliers.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    db.suppliers[index] = { ...db.suppliers[index], ...validatedData };
    
    saveDB(db);
    res.json(db.suppliers[index]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      next(error);
    }
  }
});

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = loadDB();
    const index = db.suppliers.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    db.suppliers.splice(index, 1);
    saveDB(db);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
