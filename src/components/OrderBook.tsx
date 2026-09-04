import React from 'react';
import { 
  Search, 
  PlusCircle, 
  CheckCircle, 
  Truck, 
  MapPin, 
  ArrowRight, 
  Clock, 
  Package,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import { PurchaseOrder, SalesOrder } from '../types';
import { formatCurrency } from '../utils/currency';

interface OrderBookProps {
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  currency: 'USD' | 'INR';
  currentUser: any;
  handleMarkReceived: (poId: string) => void;
  handleDispatchSO: (soId: string) => void;
  handleCompleteSO: (soId: string) => void;
  setIsPOModalOpen: (open: boolean) => void;
  setIsSOModalOpen: (open: boolean) => void;
  ordersSearch: string;
  setOrdersSearch: (search: string) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  purchaseOrders,
  salesOrders,
  currency,
  currentUser,
  handleMarkReceived,
  handleDispatchSO,
  handleCompleteSO,
  setIsPOModalOpen,
  setIsSOModalOpen,
  ordersSearch,
  setOrdersSearch
}) => {

  // Filter Purchase Orders
  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    if (!ordersSearch) return true;
    const query = ordersSearch.toLowerCase();
    return (
      po.poNumber.toLowerCase().includes(query) ||
      po.supplierName.toLowerCase().includes(query) ||
      po.status.toLowerCase().includes(query)
    );
  });

  // Filter Sales Orders
  const filteredSalesOrders = salesOrders.filter(so => {
    if (!ordersSearch) return true;
    const query = ordersSearch.toLowerCase();
    return (
      so.soNumber.toLowerCase().includes(query) ||
      so.customerName.toLowerCase().includes(query) ||
      so.status.toLowerCase().includes(query)
    );
  });

  const isEditable = currentUser?.role === 'ADMIN' || 
                    currentUser?.role === 'WAREHOUSE_MANAGER' || 
                    currentUser?.role === 'SUPPLIER';

  return (
    <div className="space-y-8" id="orders-view">
      {/* Unified Search Input */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Query global order registries by ref number, client name, status..."
          value={ordersSearch}
          onChange={(e) => setOrdersSearch(e.target.value)}
          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {/* Grid of POs and SOs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 1. Purchase Orders replenishments */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                Purchase Orders Registry
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Inbound procurements resting to raise stock level buffers.</p>
            </div>
            <button
              onClick={() => setIsPOModalOpen(true)}
              disabled={!isEditable}
              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                isEditable 
                  ? 'btn-gradient' 
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Procure
            </button>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredPurchaseOrders.length === 0 ? (
              <p className="p-8 text-center font-mono text-xs text-slate-600">No purchase records registered.</p>
            ) : (
              filteredPurchaseOrders.map((po) => (
                <div key={po.id} className="bg-white/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs space-y-3 hover:border-blue-500/15 transition-all">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-900 font-mono">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-[12px]">{po.poNumber}</p>
                      <p className="text-[9px] text-slate-500">SUPPLIER: {po.supplierName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-400">{formatCurrency(po.totalAmount, currency)}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-black uppercase border tracking-wide mt-1 inline-block ${
                        po.status === 'Received' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {po.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-900">
                        <span>{it.name}</span>
                        <span>{it.quantity} Units @ {formatCurrency(it.price, currency)}</span>
                      </div>
                    ))}
                  </div>

                  {po.status !== 'Received' && (
                    <button
                      onClick={() => handleMarkReceived(po.id)}
                      disabled={!isEditable}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        isEditable
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark replenishment received (Inc Stock)
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Sales Orders fulfillments */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Sales Orders Registry
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Outbound client shipments generated via commercial protocols.</p>
            </div>
            <button
              onClick={() => setIsSOModalOpen(true)}
              disabled={!isEditable}
              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                isEditable 
                  ? 'btn-gradient-secondary' 
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Sell Item
            </button>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSalesOrders.length === 0 ? (
              <p className="p-8 text-center font-mono text-xs text-slate-600">No sales records registered.</p>
            ) : (
              filteredSalesOrders.map((so) => (
                <div key={so.id} className="bg-white/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs space-y-3 hover:border-emerald-500/15 transition-all">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-900 font-mono">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-[12px]">{so.soNumber}</p>
                      <p className="text-[9px] text-slate-500">CLIENT: {so.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">{formatCurrency(so.totalAmount, currency)}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-mono font-black uppercase border tracking-wide mt-1 inline-block ${
                        so.status === 'Completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : so.status === 'Dispatched'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {so.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {so.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-900">
                        <span>{it.name}</span>
                        <span>{it.quantity} Units @ {formatCurrency(it.price, currency)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions buttons based on status */}
                  <div className="grid grid-cols-1 gap-2">
                    {so.status === 'Pending' && (
                      <button
                        onClick={() => handleDispatchSO(so.id)}
                        disabled={!isEditable}
                        className={`w-full py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isEditable
                            ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                            : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Dispatch Outbound Cargo (Dec Stock)
                      </button>
                    )}

                    {so.status === 'Dispatched' && (
                      <button
                        onClick={() => handleCompleteSO(so.id)}
                        disabled={!isEditable}
                        className={`w-full py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          isEditable
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                            : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark Delivery Complete (Confirm Handshake)
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
