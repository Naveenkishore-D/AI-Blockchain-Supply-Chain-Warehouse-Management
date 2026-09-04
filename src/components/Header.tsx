import React, { useState } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  ChevronDown, 
  Activity, 
  Search, 
  Menu,
  Network,
  Cpu,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  currentUser: { id: number; username: string; email: string; role: string } | null;
  token: string | null;
  onOpenSidebar: () => void;
  lowStockCount: number;
  activeShipments: number;
  theme?: 'light' | 'dark';
  setTheme?: (newTheme: 'light' | 'dark') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  token,
  onOpenSidebar,
  lowStockCount,
  activeShipments
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate dynamic, realistic notifications
  const alerts = [
    { id: 1, type: 'warning', title: 'Low Stock Alert', msg: `${lowStockCount} items have fallen below safety buffers.`, time: 'Just now' },
    { id: 2, type: 'info', title: 'Logistics Update', msg: `${activeShipments} shipments currently active in the South Asia corridor.`, time: '10m ago' },
    { id: 3, type: 'success', title: 'Ledger Verified', msg: 'Cryptographic supply chain ledger fully synchronized on-chain.', time: '1h ago' }
  ];

  return (
    <header className="relative w-full z-30 bg-white/40 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/40 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors duration-300">
      {/* Left side: Search & Sidebar Trigger */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenSidebar}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-white/60 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800/50 w-64">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Global database query..." 
            className="bg-transparent border-none outline-none text-xs font-mono text-slate-800 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 w-full"
            disabled
          />
        </div>
      </div>

      {/* Right side: Node status, Alerts, and profile */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            GRID_LIVE // SECURE
          </span>
        </div>

        {/* Dynamic Telemetry Metric (Active Shipments) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-300 font-bold uppercase">
            {activeShipments} TRANSITS ACTIVE
          </span>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 bg-white/60 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all relative cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Nodal Alerts</span>
                    <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">
                      {alerts.length} NEW
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/40 hover:border-slate-300 dark:hover:border-slate-800 transition-all text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-black text-[10px] uppercase tracking-wide flex items-center gap-1.5 ${
                            alert.type === 'warning' ? 'text-amber-600 dark:text-amber-500' : alert.type === 'info' ? 'text-blue-600 dark:text-blue-500' : 'text-emerald-600 dark:text-emerald-500'
                          }`}>
                            {alert.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> : alert.type === 'info' ? <Activity className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            {alert.title}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">{alert.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                          {alert.msg}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Biometric Credentials Info / User Profile Summary */}
        {currentUser && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                {currentUser?.username || 'User'}
              </span>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">
                {currentUser?.role || 'Guest'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/5">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-xs text-emerald-600 dark:text-emerald-400">
                {(currentUser?.username || 'US').substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
