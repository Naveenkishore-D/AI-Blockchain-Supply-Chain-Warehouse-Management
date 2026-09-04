import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  Ship,
  Users,
  Hash,
  BarChart3,
  Fingerprint,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Globe,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: { id: number; username: string; email: string; role: string } | null;
  handleLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  currency: 'USD' | 'INR';
  setCurrency: React.Dispatch<React.SetStateAction<'USD' | 'INR'>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  currentUser,
  handleLogout,
  theme,
  setTheme,
  currency,
  setCurrency
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'inventory', icon: Box, label: 'Inventory' },
    { id: 'shipments', icon: Ship, label: 'Logistics' },
    { id: 'directory', icon: Users, label: 'Suppliers' },
    { id: 'orders', icon: Hash, label: 'Orders' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'ledger', icon: Fingerprint, label: 'Blockchain' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  const userRole = currentUser?.role?.toUpperCase() || '';
  const filteredItems = navigationItems.filter(item => {
    if (userRole === 'ADMIN') {
      return true; // Admin gets access to all tabs
    }
    if (userRole === 'WAREHOUSE_MANAGER' || userRole === 'SUPPLIER' || userRole === 'CUSTOMER') {
      // All these roles get: Dashboard, Inventory, Orders, Shipments/Logistics
      return ['dashboard', 'inventory', 'shipments', 'orders'].includes(item.id);
    }
    return ['dashboard']; // fallback
  });

  return (
    <motion.aside
      id="main-sidebar"
      initial={{ x: -280 }}
      animate={{ 
        x: 0, 
        width: isCollapsed ? 80 : 260 
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className={`fixed lg:relative top-0 left-0 h-screen z-50 flex flex-col bg-white/90 dark:bg-slate-950/95 border-r border-slate-200 dark:border-slate-800/80 backdrop-blur-xl text-slate-800 dark:text-slate-200 transition-all duration-300`}
    >
      {/* Sidebar Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 shrink-0 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 neon-border animate-pulse-glow">
            <Globe className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="font-black text-sm tracking-wider font-[var(--font-orbit)] bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-400">
                NEXUS SCM
              </span>
              <span className="text-[9px] font-mono tracking-[0.2em] text-slate-500 uppercase">
                Enterprise v4.0
              </span>
            </motion.div>
          )}
        </div>

        {/* Collapse Button for desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-6 h-6 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
        {filteredItems.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-sans text-xs font-medium cursor-pointer relative group ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600/15 to-emerald-500/5 dark:from-blue-600/20 dark:to-emerald-500/10 text-blue-700 dark:text-white border-l-4 border-blue-600 dark:border-blue-500 shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/50'
              }`}
              title={isCollapsed ? tab.label : ''}
            >
              <tab.icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-100'}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-medium tracking-wide"
                >
                  {tab.label}
                </motion.span>
              )}

              {/* Collapsed label tooltip */}
              {isCollapsed && (
                <div className="absolute left-16 hidden group-hover:block bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-[10px] uppercase tracking-wider font-mono py-1 px-3 rounded border border-slate-200 dark:border-slate-800 shadow-xl whitespace-nowrap z-50">
                  {tab.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Preferences/Status Area */}
      <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-4">
        {/* Preferences Section: Stacked one by one */}
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="px-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                Preferences
              </span>
            </div>

            <div className="bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-2.5 space-y-2.5">
              {/* Preference: Dark Mode Toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <ThemeToggle theme={theme} onToggle={setTheme} />
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed state: One by one vertically */
          <div className="flex flex-col items-center gap-2 bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 p-2 rounded-2xl">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 border border-slate-200 dark:border-slate-700 shadow-sm transition-all cursor-pointer"
              title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        )}

        {/* User Badge */}
        {currentUser && (
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/50 rounded-2xl p-3">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600/20 to-emerald-500/20 flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0">
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase">
                  {(currentUser?.username || 'US').substring(0, 2)}
                </span>
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden flex-1">
                  <p className="text-[10px] font-black text-slate-800 dark:text-white truncate uppercase tracking-wider">{currentUser?.username || 'User'}</p>
                  <p className="text-[8px] font-mono text-slate-500 truncate uppercase tracking-tighter">{currentUser?.role || 'Guest'}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Terminate Session
              </button>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
};
