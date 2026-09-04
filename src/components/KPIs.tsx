import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Globe, 
  Truck, 
  AlertTriangle,
  IndianRupee,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '../utils/currency';

interface KPIsProps {
  totalAssets: number;
  currency: 'USD' | 'INR';
  hubsCount: number;
  activeShipments: number;
  lowStockCount: number;
}

export const KPIs: React.FC<KPIsProps> = ({
  totalAssets,
  currency,
  hubsCount,
  activeShipments,
  lowStockCount
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="metrics-panel">
      {/* 1. Valuation */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="glass-card p-6 rounded-3xl group relative overflow-hidden border-t-2 border-t-blue-500 bg-white/40 dark:bg-slate-950/20"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity duration-300">
          {currency === 'INR' ? <IndianRupee className="w-16 h-16 text-blue-500" /> : <DollarSign className="w-16 h-16 text-blue-500" />}
        </div>
        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 mb-1">Network Valuation</p>
        <div className="flex items-baseline gap-2">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-black font-[var(--font-orbit)] text-blue-600 dark:text-blue-400"
          >
            {formatCurrency(totalAssets, currency)}
          </motion.h2>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">{currency}</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold">
            +4.2% AI Optimized
          </span>
        </div>
      </motion.div>

      {/* 2. Hubs */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="glass-card p-6 rounded-3xl group relative overflow-hidden border-t-2 border-t-emerald-500 bg-white/40 dark:bg-slate-950/20"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity duration-300">
          <Globe className="w-16 h-16 text-emerald-500 dark:text-emerald-400" />
        </div>
        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 mb-1">Active Hubs</p>
        <div className="flex items-baseline gap-2">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3.5xl font-black font-[var(--font-orbit)] text-emerald-600 dark:text-emerald-400"
          >
            {hubsCount}
          </motion.h2>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">NODES</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Operational Grid Active
          </span>
        </div>
      </motion.div>

      {/* 3. Cargoes */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="glass-card p-6 rounded-3xl group relative overflow-hidden border-t-2 border-t-purple-500 bg-white/40 dark:bg-slate-950/20"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity duration-300">
          <Truck className="w-16 h-16 text-purple-600 dark:text-purple-500" />
        </div>
        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 mb-1">Active Cargo Pulse</p>
        <div className="flex items-baseline gap-2">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3.5xl font-black font-[var(--font-orbit)] text-purple-600 dark:text-purple-400"
          >
            {activeShipments}
          </motion.h2>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">TRANSITS</span>
        </div>
        <div className="mt-4 w-full">
          <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(20, activeShipments * 15))}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </div>
      </motion.div>

      {/* 4. Stock Alerts */}
      <motion.div 
        whileHover={{ y: -5, scale: 1.01 }}
        className="glass-card p-6 rounded-3xl group relative overflow-hidden border-t-2 border-t-amber-500 bg-white/40 dark:bg-slate-950/20"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition-opacity duration-300">
          <AlertTriangle className="w-16 h-16 text-amber-500" />
        </div>
        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 mb-1">Stock Level Alerts</p>
        <div className="flex items-baseline gap-2">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`text-3.5xl font-black font-[var(--font-orbit)] ${lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}
          >
            {lowStockCount}
          </motion.h2>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">WARNINGS</span>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-amber-600 dark:text-amber-500/80 font-mono text-[9px] uppercase tracking-wider font-bold">
          {lowStockCount > 0 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              SKUs require immediate resupply
            </>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">All inventory levels optimized</span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
