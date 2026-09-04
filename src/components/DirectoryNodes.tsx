import React, { useState, useEffect } from 'react';
import { safeFetch } from '../lib/apiClient';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Database, 
  Layers, 
  Cpu, 
  User, 
  Search,
  Globe,
  ShieldCheck,
  Check,
  X,
  Ban,
  Loader2,
  Users,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import { Warehouse, Supplier, Customer, InventoryItem } from '../types';

interface DirectoryNodesProps {
  warehouses: Warehouse[];
  suppliers: Supplier[];
  customers: Customer[];
  inventory: InventoryItem[];
  token?: string | null;
  currentUser?: any;
}

export const DirectoryNodes: React.FC<DirectoryNodesProps> = ({
  warehouses,
  suppliers,
  customers,
  inventory,
  token,
  currentUser
}) => {
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';
  
  // Set default tab. Admins will naturally appreciate having the approvals tab available, but let's default to hubs
  const [activeSubTab, setActiveSubTab] = useState<'hubs' | 'suppliers' | 'clients' | 'users'>('hubs');
  const [query, setQuery] = useState('');

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token || !isAdmin) return;
    setLoadingUsers(true);
    setUserError(null);
    try {
      const response = await safeFetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch users');
      }
      setUsers(response.data?.users || []);
    } catch (err: any) {
      setUserError(err.message || 'Failed to load user directories.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch users when subtab changes to 'users'
  useEffect(() => {
    if (activeSubTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeSubTab, token, isAdmin]);

  const handleUpdateStatus = async (userId: number, newStatus: 'ACTIVE' | 'BLOCKED' | 'REJECTED' | 'PENDING') => {
    if (!token) return;
    setActionLoadingId(userId);
    setUserError(null);
    setUserSuccess(null);
    try {
      const response = await safeFetch(`/api/auth/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        throw new Error(response.error || 'Failed to update user status');
      }
      
      // Update state locally
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      setUserSuccess(response.data?.message || `User status updated to ${newStatus}.`);
      
      // Auto-clear success message after 4s
      setTimeout(() => setUserSuccess(null), 4000);
    } catch (err: any) {
      setUserError(err.message || 'Failed to update user status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Calculate allocated stock volume per warehouse
  const getWarehouseStock = (whId: string) => {
    return inventory
      .filter(item => item.warehouseId === whId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="space-y-6" id="directory-view">
      
      {/* Sub tabs and Search */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1 sm:gap-0">
          <button
            onClick={() => setActiveSubTab('hubs')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
              activeSubTab === 'hubs' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Warehouses ({warehouses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
              activeSubTab === 'suppliers' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('clients')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer ${
              activeSubTab === 'clients' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Customers ({customers.length})
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Users & Approvals
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={activeSubTab === 'users' ? "Search users by name or email..." : "Search directory node records..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-9 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Grid rendering based on active sub tab */}
      {activeSubTab !== 'users' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Hubs */}
          {activeSubTab === 'hubs' && 
            warehouses
              .filter(w => !query || w.name.toLowerCase().includes(query.toLowerCase()) || w.state.toLowerCase().includes(query.toLowerCase()))
              .map(w => {
                const currentStock = getWarehouseStock(w.id);
                const percentUsed = Math.min(100, Math.round((currentStock / w.capacity) * 100));

                return (
                  <div key={w.id} className="glass-card p-5 hover:border-blue-500/20 transition-all space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide">{w.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-600" /> {w.state}, India
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Address Grid:</span>
                        <span className="text-slate-700 dark:text-slate-300 text-right truncate max-w-[150px]">{w.address}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Maximum Volume Capacity:</span>
                        <span className="text-slate-700 dark:text-slate-300">{w.capacity.toLocaleString()} Units</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Current Allocated Units:</span>
                        <span className="text-slate-800 dark:text-slate-100 font-bold">{currentStock.toLocaleString()} Units</span>
                      </div>
                    </div>

                    {/* Utilization Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>STORAGE LOAD INDEX:</span>
                        <span className={`${percentUsed > 85 ? 'text-red-500 font-bold' : percentUsed > 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {percentUsed}% Filled
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentUsed > 85 ? 'bg-red-500' : percentUsed > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
          }

          {/* Suppliers */}
          {activeSubTab === 'suppliers' &&
            suppliers
              .filter(s => !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.contactPerson.toLowerCase().includes(query.toLowerCase()))
              .map(s => (
                <div key={s.id} className="glass-card p-5 hover:border-emerald-500/20 transition-all space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide">{s.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">SUPPLIER STAGE-1 NODE</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Contact Officer:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{s.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                      <span className="text-slate-700 dark:text-slate-300">{s.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={s.email}>{s.email}</span>
                    </div>
                  </div>
                </div>
              ))
          }

          {/* Customers */}
          {activeSubTab === 'clients' &&
            customers
              .filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.company.toLowerCase().includes(query.toLowerCase()))
              .map(c => (
                <div key={c.id} className="glass-card p-5 hover:border-purple-500/20 transition-all space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wide">{c.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{c.company}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Target Delivery Location:</span>
                      <span className="text-slate-700 dark:text-slate-300 text-right truncate max-w-[180px]" title={c.address}>{c.address}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                      <span className="text-slate-700 dark:text-slate-300">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={c.email}>{c.email}</span>
                    </div>
                  </div>
                </div>
              ))
          }

        </div>
      ) : (
        /* User Approvals Sub-Tab */
        <div className="space-y-4">
          
          {/* Notifications Panel */}
          {userError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{userError}</span>
            </div>
          )}

          {userSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>{userSuccess}</span>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">User Directory Accounts</h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">Approve registration requests, block malicious operators, or reject node profiles.</p>
              </div>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase font-mono rounded-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {loadingUsers ? 'Syncing...' : 'Sync Directory'}
              </button>
            </div>

            {loadingUsers ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-500 font-mono">Synchronizing state directories...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/40 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Operator Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Designated Role</th>
                      <th className="py-3 px-4">System Status</th>
                      <th className="py-3 px-4 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs font-mono">
                    {users
                      .filter(u => !query || 
                        u.fullName.toLowerCase().includes(query.toLowerCase()) || 
                        u.email.toLowerCase().includes(query.toLowerCase()) ||
                        u.role.toLowerCase().includes(query.toLowerCase())
                      )
                      .map((u) => {
                        const isSelf = u.id === currentUser?.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-950/10 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                              {u.fullName}
                              {isSelf && <span className="ml-2 text-[8px] bg-blue-500/20 text-blue-500 border border-blue-500/20 px-1 py-0.5 rounded font-bold uppercase">YOU</span>}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold uppercase">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {u.status === 'ACTIVE' && (
                                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase">
                                  ACTIVE
                                </span>
                              )}
                              {u.status === 'PENDING' && (
                                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-bold uppercase animate-pulse">
                                  PENDING
                                </span>
                              )}
                              {u.status === 'BLOCKED' && (
                                <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[9px] font-bold uppercase">
                                  BLOCKED
                                </span>
                              )}
                              {u.status === 'REJECTED' && (
                                <span className="px-2.5 py-0.5 bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-full text-[9px] font-bold uppercase">
                                  REJECTED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                {u.status !== 'ACTIVE' && (
                                  <button
                                    onClick={() => handleUpdateStatus(u.id, 'ACTIVE')}
                                    disabled={actionLoadingId === u.id}
                                    className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white border border-emerald-600/20 rounded text-[9px] font-bold text-emerald-500 uppercase transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Approve registration request"
                                  >
                                    {actionLoadingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    Approve
                                  </button>
                                )}

                                {u.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleUpdateStatus(u.id, 'REJECTED')}
                                    disabled={actionLoadingId === u.id}
                                    className="px-2.5 py-1 bg-slate-600/10 hover:bg-slate-600 hover:text-white border border-slate-600/20 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Reject registration request"
                                  >
                                    {actionLoadingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                    Reject
                                  </button>
                                )}

                                {u.status !== 'BLOCKED' && !isSelf && (
                                  <button
                                    onClick={() => handleUpdateStatus(u.id, 'BLOCKED')}
                                    disabled={actionLoadingId === u.id}
                                    className="px-2.5 py-1 bg-rose-600/10 hover:bg-rose-600 hover:text-white border border-rose-600/20 rounded text-[9px] font-bold text-rose-500 uppercase transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Block operator account"
                                  >
                                    {actionLoadingId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                                    Block
                                  </button>
                                )}

                                {isSelf && (
                                  <span className="text-[10px] text-slate-400 dark:text-slate-600 px-3 py-1 font-sans italic select-none">
                                    Self Guarded
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                          No registered user records match criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
