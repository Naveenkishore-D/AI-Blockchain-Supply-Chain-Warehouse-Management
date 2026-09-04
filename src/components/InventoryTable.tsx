import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  PlusCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sliders,
  History,
  TrendingUp,
  TrendingDown,
  X,
  Edit2,
  Trash2,
  Activity,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '../utils/currency';
import { InventoryItem, Warehouse, Supplier, StockMovement } from '../types';

interface InventoryTableProps {
  inventory: InventoryItem[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  currency: 'USD' | 'INR';
  currentUser: any;
  onAddClick: () => void;
  authFetch: (url: RequestInfo | URL, options?: RequestInit) => Promise<Response>;
  fetchAllData: () => Promise<void>;
}

type SortField = 'sku' | 'name' | 'category' | 'quantity' | 'unitPrice';
type SortOrder = 'asc' | 'desc';

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  warehouses,
  suppliers,
  currency,
  currentUser,
  onAddClick,
  authFetch,
  fetchAllData
}) => {
  // Navigation tabs within inventory
  const [activeTab, setActiveTab] = useState<'register' | 'movements'>('register');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('quantity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Global Movements ledger state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsSearch, setMovementsSearch] = useState('');

  // Modals / Dialog states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isStockActionModalOpen, setIsStockActionModalOpen] = useState(false);
  const [stockActionItem, setStockActionItem] = useState<InventoryItem | null>(null);
  const [stockActionType, setStockActionType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [stockActionQty, setStockActionQty] = useState('10');
  const [stockActionReason, setStockActionReason] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load movements when the movements tab is active
  const fetchMovements = async () => {
    setMovementsLoading(true);
    try {
      const res = await authFetch('/api/inventory/movements');
      if (res.ok) {
        const data = await res.json();
        // Sort newest first
        const sorted = data.sort((a: StockMovement, b: StockMovement) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setMovements(sorted);
      }
    } catch (err) {
      console.error("Failed to load stock movements", err);
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'movements') {
      fetchMovements();
    }
  }, [activeTab, inventory]);

  // Get categories for filter dropdown
  const categories = useMemo(() => {
    const list = new Set(inventory.map(item => item.category));
    return ['All', ...Array.from(list)];
  }, [inventory]);

  // Handle column header clicks to sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Helper to auto-calculate status based on rules
  const getStockStatus = (qty: number, reorderPoint: number) => {
    if (qty === 0) return 'OUT OF STOCK';
    if (qty <= reorderPoint) return 'LOW STOCK';
    return 'IN STOCK';
  };

  // Filter & Sort inventory items
  const processedInventory = useMemo(() => {
    let result = [...inventory];

    // Search filter
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter(item => item.category === categoryFilter);
    }

    // Warehouse filter
    if (warehouseFilter !== 'All') {
      result = result.filter(item => item.warehouseId === warehouseFilter);
    }

    // Stock level status filter
    if (stockStatusFilter !== 'All') {
      result = result.filter(item => {
        const status = getStockStatus(item.quantity, item.reorderPoint);
        return status === stockStatusFilter.toUpperCase();
      });
    }

    // Sort items
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [inventory, searchTerm, categoryFilter, warehouseFilter, stockStatusFilter, sortField, sortOrder]);

  // Paginate items
  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedInventory.slice(startIndex, startIndex + itemsPerPage);
  }, [processedInventory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedInventory.length / itemsPerPage) || 1;

  // Filter movements for display
  const processedMovements = useMemo(() => {
    if (!movementsSearch.trim()) return movements;
    const query = movementsSearch.toLowerCase();
    return movements.filter(m => 
      m.itemName.toLowerCase().includes(query) ||
      m.sku.toLowerCase().includes(query) ||
      m.reason.toLowerCase().includes(query) ||
      m.operator.toLowerCase().includes(query) ||
      m.type.toLowerCase().includes(query)
    );
  }, [movements, movementsSearch]);

  // Render dynamic status badge based on strict calculation rules
  const renderStatusBadge = (qty: number, reorderPoint: number) => {
    const status = getStockStatus(qty, reorderPoint);
    if (status === 'OUT OF STOCK') {
      return (
        <span className="px-2.5 py-1 bg-red-600/10 text-red-400 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
          OUT OF STOCK
        </span>
      );
    }
    if (status === 'LOW STOCK') {
      return (
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
          LOW STOCK
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        IN STOCK
      </span>
    );
  };

  const getWarehouseName = (id: string) => {
    return warehouses.find(w => w.id === id)?.name || 'Unknown Hub';
  };

  const getSupplierName = (id: string) => {
    return suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';
  };

  const isEditable = currentUser?.role === 'ADMIN' || 
                    currentUser?.role === 'WAREHOUSE_MANAGER' || 
                    currentUser?.role === 'SUPPLIER';

  // Perform Edit Product
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await authFetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.name,
          sku: editingItem.sku,
          category: editingItem.category,
          unitPrice: editingItem.unitPrice,
          reorderPoint: editingItem.reorderPoint,
          warehouseId: editingItem.warehouseId,
          supplierId: editingItem.supplierId,
          unit: editingItem.unit,
          quantity: editingItem.quantity
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update item metadata.');

      setActionSuccess(`Cryptographic Asset '${editingItem.name}' successfully re-signed and saved.`);
      await fetchAllData();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingItem(null);
        setActionSuccess(null);
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Verification rejected.');
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Stock In, Out, or Adjustment
  const handleStockAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockActionItem) return;
    const qty = Number(stockActionQty);
    if (isNaN(qty) || qty < 0) {
      setActionError('Quantity cannot be negative.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    let url = `/api/inventory/${stockActionItem.id}`;
    let body: any = { quantity: qty, reason: stockActionReason };

    if (stockActionType === 'STOCK_IN') {
      url += '/stock-in';
    } else if (stockActionType === 'STOCK_OUT') {
      url += '/stock-out';
      if (stockActionItem.quantity - qty < 0) {
        setActionError('Stockout failure: Decreasing stock below 0 is prohibited.');
        setActionLoading(false);
        return;
      }
    } else if (stockActionType === 'ADJUSTMENT') {
      url += '/stock-adjustment';
    }

    try {
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Logistics state validation failure.');

      setActionSuccess(`Stock movement logged on ledger successfully.`);
      await fetchAllData();
      setTimeout(() => {
        setIsStockActionModalOpen(false);
        setStockActionItem(null);
        setStockActionReason('');
        setActionSuccess(null);
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Audit reject.');
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Delete Product
  const handleDeleteProduct = async () => {
    if (!deletingItem) return;
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await authFetch(`/api/inventory/${deletingItem.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to purge asset record.');
      }

      setActionSuccess(`Asset purging executed. Immutable delete logged.`);
      await fetchAllData();
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setDeletingItem(null);
        setActionSuccess(null);
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Operation forbidden.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="inventory-view">
      {/* Tab Navigation Segment */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('register')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'register'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Active Register
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider font-mono border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Movements Ledger
        </button>
      </div>

      {activeTab === 'register' ? (
        <>
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Active Inventory Register</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">Cryptographically audited logistics grid assets.</p>
            </div>
            <button
              onClick={onAddClick}
              disabled={!isEditable}
              className={`px-5 py-2.5 rounded-xl font-sans font-bold text-xs tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer ${
                isEditable 
                  ? 'btn-gradient' 
                  : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-55'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Add Inventory Asset
            </button>
          </div>

          {/* Query / Filters bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <div className="relative col-span-1 md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search SCM SKU, item name, categories..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs font-mono text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs font-mono text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Stock Levels</option>
                <option value="instock">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="shortage">Out of Stock / Shortage</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('sku')}>
                    <div className="flex items-center gap-1.5">
                      SKU & Item Name
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1.5">
                      Category
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-4">Logistics Hub</th>
                  <th className="p-4">Supplier Node</th>
                  <th className="p-4 cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('unitPrice')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      Price
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('quantity')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      Stock Volume
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Secured QR</th>
                  <th className="p-4 text-center">Ledger Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-900 text-xs text-slate-700 dark:text-slate-300">
                {paginatedInventory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500 font-mono">
                      No matching assets logged in decentralized datastore.
                    </td>
                  </tr>
                ) : (
                  paginatedInventory.map((item) => {
                    const wh = getWarehouseName(item.warehouseId);
                    const sup = getSupplierName(item.supplierId);
                    // Calculate stock level percentage for the visual indicator line
                    const maxLevel = 1000; 
                    const percentage = Math.min(100, (item.quantity / maxLevel) * 100);

                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 border-b border-slate-200/40 dark:border-slate-800/40 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                          <p className="font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">{item.sku}</p>
                        </td>
                        <td className="p-4 font-mono text-[10px] uppercase text-blue-600 dark:text-blue-400">
                          {item.category}
                        </td>
                        <td className="p-4 font-sans text-slate-700 dark:text-slate-300">
                          {wh}
                        </td>
                        <td className="p-4 font-sans text-slate-600 dark:text-slate-400 text-[11px]">
                          {sup}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.unitPrice, currency)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                              {item.quantity.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                            </span>
                            
                            {/* Dynamic stock progress bar */}
                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                              <div 
                                className={`h-full rounded-full ${
                                  item.quantity === 0 ? 'bg-red-600' : item.quantity <= item.reorderPoint ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          {renderStatusBadge(item.quantity, item.reorderPoint)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex p-1 bg-white rounded-lg shadow-md border border-slate-200 shrink-0">
                            <QRCodeSVG value={`INVENTORY:${item.id}`} size={28} />
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Stock Actions Trigger */}
                            <button
                              title="Update Stock Levels"
                              onClick={() => {
                                setStockActionItem(item);
                                setStockActionType('STOCK_IN');
                                setStockActionQty('10');
                                setStockActionReason('');
                                setIsStockActionModalOpen(true);
                              }}
                              className="p-1 text-blue-500 hover:text-blue-700 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg transition-all cursor-pointer"
                            >
                              <Sliders className="w-3.8 h-3.8" />
                            </button>
                            
                            {/* Edit Button */}
                            <button
                              disabled={!isEditable}
                              title="Edit Metadata"
                              onClick={() => {
                                setEditingItem({ ...item });
                                setIsEditModalOpen(true);
                              }}
                              className={`p-1 transition-all rounded-lg ${
                                isEditable 
                                  ? 'text-amber-500 hover:text-amber-600 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer' 
                                  : 'text-slate-600 cursor-not-allowed opacity-30'
                              }`}
                            >
                              <Edit2 className="w-3.8 h-3.8" />
                            </button>

                            {/* Delete Button */}
                            <button
                              disabled={!isEditable}
                              title="Delete Product"
                              onClick={() => {
                                setDeletingItem(item);
                                setIsDeleteModalOpen(true);
                              }}
                              className={`p-1 transition-all rounded-lg ${
                                isEditable 
                                  ? 'text-red-500 hover:text-red-600 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer' 
                                  : 'text-slate-600 cursor-not-allowed opacity-30'
                              }`}
                            >
                              <Trash2 className="w-3.8 h-3.8" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-950/20 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="text-[11px] font-mono text-slate-500">
              Showing {processedInventory.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedInventory.length)} of {processedInventory.length} SKU records
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Movements Ledger Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 font-mono">Blockchain stock movements</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">Decentralized, untamperable stock change verification history ledger.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search movements ledger..."
                value={movementsSearch}
                onChange={(e) => setMovementsSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Product Name & SKU</th>
                  <th className="p-4 text-center">Event Type</th>
                  <th className="p-4 text-right">Delta Qty</th>
                  <th className="p-4 text-right">Previous → Current</th>
                  <th className="p-4">Reason / Notes</th>
                  <th className="p-4">Operator Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-900 text-xs text-slate-700 dark:text-slate-300 font-mono">
                {movementsLoading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      Querying immutable blockchain nodes...
                    </td>
                  </tr>
                ) : processedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      No stock movement records found in blockchain ledger.
                    </td>
                  </tr>
                ) : (
                  processedMovements.map((mov) => {
                    const isPositive = mov.quantityChanged > 0;
                    const isAdjustment = mov.type === 'ADJUSTMENT';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition-colors border-b border-slate-250 dark:border-slate-850">
                        <td className="p-4 text-[10px] text-slate-400">
                          {new Date(mov.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 font-sans">
                          <p className="font-bold text-slate-850 dark:text-slate-100">{mov.itemName}</p>
                          <p className="text-[9px] text-slate-500 font-mono font-bold tracking-wider">{mov.sku}</p>
                        </td>
                        <td className="p-4 text-center">
                          {isAdjustment ? (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-black uppercase">
                              ADJUST
                            </span>
                          ) : isPositive ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase flex items-center justify-center gap-1 w-max mx-auto">
                              <TrendingUp className="w-3 h-3" />
                              IN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[9px] font-black uppercase flex items-center justify-center gap-1 w-max mx-auto">
                              <TrendingDown className="w-3 h-3" />
                              OUT
                            </span>
                          )}
                        </td>
                        <td className={`p-4 text-right font-bold ${isAdjustment ? 'text-amber-500' : isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {mov.quantityChanged > 0 ? `+${mov.quantityChanged}` : mov.quantityChanged}
                        </td>
                        <td className="p-4 text-right text-slate-400 text-[10px]">
                          {mov.previousQuantity} → {mov.newQuantity}
                        </td>
                        <td className="p-4 font-sans text-slate-500 text-[11px] max-w-[200px] truncate" title={mov.reason}>
                          {mov.reason}
                        </td>
                        <td className="p-4 text-[10px] text-slate-400">
                          {mov.operator}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- MODAL DIALOGS --- */}

      {/* Modal: Edit Metadata */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs font-mono text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-amber-500" />
                Edit Cryptographic Asset
              </h4>
              <button onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEditProduct} className="space-y-4 text-[11px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Item ID (System Ref)</label>
                  <input
                    type="text"
                    disabled
                    value={editingItem.id}
                    className="w-full bg-slate-950/60 border border-slate-800/60 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Item Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Processors">Processors</option>
                    <option value="Sensors">Sensors</option>
                    <option value="Batteries">Batteries</option>
                    <option value="Transceivers">Transceivers</option>
                    <option value="Structural">Structural</option>
                    <option value="Electronics">Electronics Class</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Pharmaceuticals">Pharmaceuticals</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Logistics Hub</label>
                  <select
                    value={editingItem.warehouseId}
                    onChange={(e) => setEditingItem({ ...editingItem, warehouseId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Supplier Node</label>
                  <select
                    value={editingItem.supplierId}
                    onChange={(e) => setEditingItem({ ...editingItem, supplierId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Reorder Safety Limit</label>
                  <input
                    type="number"
                    required
                    value={editingItem.reorderPoint}
                    onChange={(e) => setEditingItem({ ...editingItem, reorderPoint: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Current Physical Quantity</label>
                  <input
                    type="number"
                    required
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[9px] text-amber-500 block">Changing quantity here creates an ADJUSTMENT log.</span>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Packaging Unit</label>
                  <input
                    type="text"
                    required
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="Units"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {actionLoading ? 'Verifying...' : 'Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stock Actions (In, Out, Adjust) */}
      {isStockActionModalOpen && stockActionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-xs font-mono text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-500" />
                Ledger Stock Movement
              </h4>
              <button onClick={() => { setIsStockActionModalOpen(false); setStockActionItem(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 space-y-1">
              <p className="font-sans font-bold text-xs text-slate-200">{stockActionItem.name}</p>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>SKU: {stockActionItem.sku}</span>
                <span>Active Stock: <strong className="text-slate-100 font-bold">{stockActionItem.quantity} {stockActionItem.unit}</strong></span>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleStockAction} className="space-y-4">
              <div className="space-y-2">
                <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Movement Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockActionType('STOCK_IN')}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      stockActionType === 'STOCK_IN'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Stock In
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockActionType('STOCK_OUT')}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      stockActionType === 'STOCK_OUT'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Stock Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockActionType('ADJUSTMENT')}
                    className={`py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      stockActionType === 'ADJUSTMENT'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Adjust Stock
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                    {stockActionType === 'ADJUSTMENT' ? 'New Target Quantity' : 'Delta Quantity'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockActionQty}
                    onChange={(e) => setStockActionQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Resulting Quantity</label>
                  <div className="w-full bg-slate-950 border border-slate-800/60 rounded-xl px-3 py-2 text-slate-400">
                    {(() => {
                      const qtyVal = Number(stockActionQty) || 0;
                      if (stockActionType === 'STOCK_IN') {
                        return stockActionItem.quantity + qtyVal;
                      } else if (stockActionType === 'STOCK_OUT') {
                        return Math.max(0, stockActionItem.quantity - qtyVal);
                      } else {
                        return qtyVal;
                      }
                    })()} {stockActionItem.unit}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Ledger Action Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit variance, Shipment Arrival, Damaged goods removal"
                  value={stockActionReason}
                  onChange={(e) => setStockActionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 placeholder-slate-600"
                />
              </div>

              <div className="flex gap-2.5 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsStockActionModalOpen(false); setStockActionItem(null); }}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {actionLoading ? 'Executing Audit...' : 'Execute Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {isDeleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 text-xs font-mono text-slate-100 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-black text-slate-200 uppercase tracking-wider text-sm">Purge Cryptographic Asset?</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                You are about to execute a permanent deletion of <strong className="text-slate-200 font-bold">{deletingItem.name}</strong> ({deletingItem.sku}). This cannot be undone and will be permanently recorded in the immutable audit blockchain logs.
              </p>
            </div>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-left">
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-left">
                <span>{actionSuccess}</span>
              </div>
            )}

            <div className="flex gap-2.5 pt-3 justify-center">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => { setIsDeleteModalOpen(false); setDeletingItem(null); }}
                className="flex-1 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteProduct}
                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all cursor-pointer disabled:opacity-40"
              >
                {actionLoading ? 'Purging...' : 'Execute Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
