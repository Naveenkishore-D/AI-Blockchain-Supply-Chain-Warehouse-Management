import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  AlertTriangle, 
  Loader2, 
  Network, 
  ShieldCheck, 
  Terminal, 
  Lock, 
  User as UserIcon, 
  Key, 
  Shield, 
  Building2, 
  Package, 
  Users, 
  Bike, 
  ArrowRight,
  BrainCircuit,
  Boxes,
  MapPin,
  Sparkles,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider } from './lib/firebase';

// Import Modular Dashboard Components
import { Sidebar } from './components/Sidebar';
import { LoginDashboard } from './components/LoginDashboard';
import { Header } from './components/Header';
import { KPIs } from './components/KPIs';
import { InventoryTable } from './components/InventoryTable';
import { AIAssistant } from './components/AIAssistant';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BlockchainLedger } from './components/BlockchainLedger';
import { LogisticsTelemetry } from './components/LogisticsTelemetry';
import { OrderBook } from './components/OrderBook';
import { DirectoryNodes } from './components/DirectoryNodes';
import { SettingsPanel } from './components/SettingsPanel';
import { BlockchainBackground, IoTConnections } from './components/FuturisticBackgrounds';
import { getApiUrl, safeFetch } from './lib/apiClient';
import { 
  FALLBACK_SUPPLIERS, 
  FALLBACK_CUSTOMERS, 
  FALLBACK_WAREHOUSES, 
  FALLBACK_INVENTORY, 
  FALLBACK_BLOCKCHAIN 
} from './data/fallbackData';

// Import types
import {
  Supplier,
  Customer,
  Warehouse,
  InventoryItem,
  PurchaseOrder,
  SalesOrder,
  Shipment,
  BlockchainBlock,
  PredictionResult,
  ChatMessage
} from './types';

export default function App() {
  console.log('App Core Initialization Node Triggered');
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_theme');
      if (saved) return saved as 'light' | 'dark';
      return 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nexus_theme', theme);
  }, [theme]);

  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'shipments' | 'directory' | 'orders' | 'analytics' | 'ledger' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Auth States
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem('nexus_token'); } catch (e) { return null; }
  });
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; email: string; role: string } | null>(() => {
    try {
      const cached = localStorage.getItem('nexus_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [authRole, setAuthRole] = useState('ADMIN');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Master Lists State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [blockchain, setBlockchain] = useState<BlockchainBlock[]>([]);
  const [ledgerVerification, setLedgerVerification] = useState<{ verified: boolean; totalBlocks: number; errors: string[] } | null>(null);
  
  // Analytics State
  const [selectedState, setSelectedState] = useState('All');
  const [currency, setCurrency] = useState<'USD' | 'INR'>('INR');

  // Search queries
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [shipmentsSearch, setShipmentsSearch] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');

  // Web3 / Ethereum contract state
  const [ethStatus, setEthStatus] = useState<{
    connected: boolean;
    walletAddress: string;
    contractAddress: string;
    network: string;
  } | null>(null);

  // AI Sentinel Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'assistant',
      content: 'System fully synchronized. I have loaded the live inventory, shipment IoT telemetry logs, and the secure cryptographic block ledger. Ask me any warehouse query, stock prediction, or audit search.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [predictLoading, setPredictLoading] = useState(false);

  // Expandable settings in AI Assistant
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'ollama'>('gemini');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiModelName, setAiModelName] = useState('gemini-2.5-flash');
  const [aiRagEnabled, setAiRagEnabled] = useState(true);
  const [aiToolsEnabled, setAiToolsEnabled] = useState(true);

  // Global Loader
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Modal Forms Visibility
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSOModalOpen, setIsSOModalOpen] = useState(false);
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);

  // Modal Fields Initial States
  const [newSupplier, setNewSupplier] = useState({ name: '', contactName: '', email: '', phone: '', location: '' });
  const [newCustomer, setNewCustomer] = useState({ name: '', contactName: '', email: '', phone: '', location: '' });
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '', capacity: '20000', managerName: '' });
  const [newInventory, setNewInventory] = useState({ name: '', sku: '', category: 'Electronics', quantity: '100', unit: 'Units', warehouseId: '', supplierId: '', reorderPoint: '50', unitPrice: '10.00', barcode: '', batchNumber: '', expiryDate: '' });
  const [newPO, setNewPO] = useState({ supplierId: '', items: [{ itemId: '', quantity: '100' }] });
  const [newSO, setNewSO] = useState({ customerName: '', items: [{ itemId: '', quantity: '10' }] });

  // Custom manual block assembly
  const [newBlockForm, setNewBlockForm] = useState({
    action: 'CUSTOM_AUDIT_LOG',
    entityId: 'ent-a49d',
    entityType: 'Inventory',
    details: 'Manual ledger event registered by authorized operator.',
    operator: 'OPERATOR_ADMIN',
    trackingCode: 'TRACE-992'
  });

  // IoT sensor simulation
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [simTemp, setSimTemp] = useState(20.0);
  const [simHumidity, setSimHumidity] = useState(45.0);
  const [simGForce, setSimGForce] = useState(1.0);
  const [telemetrySubmitting, setTelemetrySubmitting] = useState(false);

  // Safe wrapper for authorized requests
  const authFetch = async (url: RequestInfo | URL, options: RequestInit = {}) => {
    let tokenVal = token;
    try {
      tokenVal = localStorage.getItem('nexus_token') || token;
    } catch (e) {
      console.error(e);
    }
    const headers = {
      ...(options.headers || {}),
    } as any;
    
    if (tokenVal) {
      headers['Authorization'] = `Bearer ${tokenVal}`;
    }
    
    const targetUrl = typeof url === 'string' ? getApiUrl(url) : url;
    return fetch(targetUrl, { ...options, headers }).then(async r => {
      if (!r.ok && r.status === 401) {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        window.location.reload();
      }
      if (!r.ok) {
        let errMsg = `HTTP ${r.status}`;
        const contentType = r.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const errData = await r.json();
            errMsg = errData.error || errData.message || errMsg;
          } catch (_) {}
        } else {
          if (r.status === 404) {
            errMsg = `Endpoint ${url} not found (404). Backend serverless or VITE_API_URL may not be configured.`;
          }
        }
        throw new Error(errMsg);
      }
      return r;
    });
  };

  // Fetch Ethereum Web3 connectivity
  const fetchEthStatus = async () => {
    try {
      const res = await authFetch('/api/blockchain/ethereum-status');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          setEthStatus(data);
        }
      }
    } catch (e) {
      console.warn('Ethereum web3 telemetry operating in fallback mode:', e);
    }
  };

  // Main datastore fetcher
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [sups, custs, whs, invs, pos, sos, ships, chain] = await Promise.all([
        authFetch('/api/suppliers?limit=100')
          .then(r => r.json())
          .then(d => d.data || d)
          .catch(() => FALLBACK_SUPPLIERS),
        authFetch('/api/customers')
          .then(r => r.json())
          .catch(() => FALLBACK_CUSTOMERS),
        authFetch('/api/warehouses')
          .then(r => r.json())
          .catch(() => FALLBACK_WAREHOUSES),
        authFetch('/api/inventory?limit=100')
          .then(r => r.json())
          .then(d => d.data || d)
          .catch(() => FALLBACK_INVENTORY),
        authFetch('/api/purchase-orders')
          .then(r => r.json())
          .catch(() => []),
        authFetch('/api/sales-orders')
          .then(r => r.json())
          .catch(() => []),
        authFetch('/api/shipments')
          .then(r => r.json())
          .catch(() => []),
        authFetch('/api/blockchain')
          .then(r => r.json())
          .catch(() => FALLBACK_BLOCKCHAIN)
      ]);

      setSuppliers(sups && sups.length > 0 ? sups : FALLBACK_SUPPLIERS);
      setCustomers(custs && custs.length > 0 ? custs : FALLBACK_CUSTOMERS);
      setWarehouses(whs && whs.length > 0 ? whs : FALLBACK_WAREHOUSES);
      setInventory(invs && invs.length > 0 ? invs : FALLBACK_INVENTORY);
      setPurchaseOrders(pos || []);
      setSalesOrders(sos || []);
      setShipments(ships || []);
      setBlockchain(chain && chain.length > 0 ? chain : FALLBACK_BLOCKCHAIN);

      await fetchEthStatus();

      // Autoselect form options
      const activeWhs = (whs && whs.length > 0 ? whs : FALLBACK_WAREHOUSES);
      const activeSups = (sups && sups.length > 0 ? sups : FALLBACK_SUPPLIERS);
      const activeInvs = (invs && invs.length > 0 ? invs : FALLBACK_INVENTORY);

      if (activeWhs && activeWhs.length > 0 && !newInventory.warehouseId) {
        setNewInventory(prev => ({ ...prev, warehouseId: activeWhs[0].id }));
      }
      if (activeSups && activeSups.length > 0 && !newInventory.supplierId) {
        setNewInventory(prev => ({ ...prev, supplierId: activeSups[0].id }));
      }
      if (activeSups && activeSups.length > 0 && !newPO.supplierId) {
        setNewPO(prev => ({ ...prev, supplierId: activeSups[0].id }));
      }
      if (activeInvs && activeInvs.length > 0) {
        if (!newPO.items[0].itemId) {
          setNewPO(prev => ({ ...prev, items: [{ itemId: activeInvs[0].id, quantity: '100' }] }));
        }
        if (!newSO.items[0].itemId) {
          setNewSO(prev => ({ ...prev, items: [{ itemId: activeInvs[0].id, quantity: '10' }] }));
        }
      }

      if (selectedShipment && ships) {
        const freshShip = (ships as Shipment[]).find(s => s.id === selectedShipment.id);
        if (freshShip) {
          setSelectedShipment(freshShip);
        }
      }

      await verifyLedger();
    } catch (e: any) {
      console.error(e);
      setErrorMsg('SCM Datastore synchronization offline. Check cloud connection configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && currentUser) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [token, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role?.toUpperCase();
    const allowedTabs: Record<string, string[]> = {
      ADMIN: ['dashboard', 'inventory', 'shipments', 'directory', 'orders', 'analytics', 'ledger', 'settings'],
      WAREHOUSE_MANAGER: ['dashboard', 'inventory', 'shipments', 'orders'],
      SUPPLIER: ['dashboard', 'inventory', 'orders', 'shipments'],
      CUSTOMER: ['dashboard', 'inventory', 'orders', 'shipments']
    };
    const allowed = allowedTabs[role] || ['dashboard'];
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await safeFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error(response.error || 'Invalid credentials');
      
      const data = response.data;
      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err: any) {
      setAuthError(err.message || 'Operator verification failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const regRes = await safeFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role: authRole })
      });
      if (!regRes.ok) throw new Error(regRes.error || 'Failed to register operator');
      
      const loginRes = await safeFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!loginRes.ok) throw new Error(loginRes.error || 'Auto-login failed');
      const loginData = loginRes.data;
      localStorage.setItem('nexus_token', loginData.token);
      localStorage.setItem('nexus_user', JSON.stringify(loginData.user));
      setToken(loginData.token);
      setCurrentUser(loginData.user);
    } catch (err: any) {
      setAuthError(err.message || 'Node registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLogin = async (userType: 'admin' | 'manager' | 'supplier' | 'customer' | 'delivery') => {
    setAuthError('Quick login bypass is disabled. Please enter your valid registered credentials.');
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setToken(null);
    setCurrentUser(null);
    setBlockchain([]);
    setSuppliers([]);
    setCustomers([]);
    setWarehouses([]);
    setInventory([]);
    setPurchaseOrders([]);
    setSalesOrders([]);
    setShipments([]);
  };

  // Google OAuth flow
  const handleGoogleLogin = async () => {
    setAuthError('Google Sign-In is disabled. Please register or sign in with your enterprise email and password.');
  };

  const handleSimulatedGoogleSignIn = async (simEmail: string, simName: string) => {
    setAuthError('Google simulated sign-in is disabled. Please register or sign in with your enterprise email and password.');
  };

  // Blockchain Operations
  const verifyLedger = async () => {
    try {
      const res = await authFetch('/api/blockchain/verify');
      const data = await res.json();
      setLedgerVerification(data);
    } catch (e) {
      console.error(e);
    }
  };

  const tamperLedgerBlock = async (index: number, newDetails: string) => {
    try {
      const res = await authFetch('/api/blockchain/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, details: newDetails })
      });
      if (res.ok) {
        await fetchAllData();
        await verifyLedger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const restoreLedgerChain = async () => {
    try {
      const res = await authFetch('/api/blockchain/restore', { method: 'POST' });
      if (res.ok) {
        await fetchAllData();
        await verifyLedger();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCustomBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/addBlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlockForm)
      });
      if (res.ok) {
        setIsAddBlockOpen(false);
        setNewBlockForm({
          action: 'CUSTOM_AUDIT_LOG',
          entityId: 'ent-' + Math.random().toString(36).substring(2, 6),
          entityType: 'Inventory',
          details: 'Manual ledger event registered by authorized operator.',
          operator: currentUser?.username || 'OPERATOR_ADMIN',
          trackingCode: 'TRACE-' + Math.floor(100 + Math.random() * 900)
        });
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Rest API Exports
  const exportReport = (reportType: 'inventory' | 'sales' | 'supplier' | 'warehouse' | 'shipment', format: 'pdf' | 'excel') => {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        import('xlsx').then((XLSX) => {
          let headers: string[] = [];
          let data: any[][] = [];
          let title = '';

          if (reportType === 'inventory') {
            title = 'Inventory Audit Report';
            headers = ['SKU', 'Name', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Reorder Point'];
            data = inventory.map(i => [i.sku, i.name, i.category, i.quantity, i.unit, i.unitPrice, i.reorderPoint]);
          } else if (reportType === 'sales') {
            title = 'Sales Protocol Book';
            headers = ['SO Number', 'Customer', 'Date', 'Amount', 'Status'];
            data = salesOrders.map(s => [s.soNumber, s.customerName, new Date(s.orderDate).toLocaleDateString(), s.totalAmount, s.status]);
          } else if (reportType === 'supplier') {
            title = 'Sourcing Nodes Registry';
            headers = ['ID', 'Name', 'Email', 'Phone', 'Location'];
            data = suppliers.map(s => [s.id, s.name, s.email, s.phone, s.location]);
          } else if (reportType === 'warehouse') {
            title = 'Logistics Hub Capacity';
            headers = ['ID', 'Name', 'Location', 'Capacity', 'Manager'];
            data = warehouses.map(w => [w.id, w.name, w.location, w.capacity, w.managerName]);
          } else if (reportType === 'shipment') {
            title = 'IoT Shipments Ledger';
            headers = ['Shipment ID', 'Ref Order', 'Carrier', 'Status', 'Origin', 'Destination'];
            data = shipments.map(s => [s.shipmentNumber, s.orderNumber, s.carrier, s.status, s.origin, s.destination]);
          }

          if (format === 'pdf') {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text(title, 14, 20);
            doc.setFontSize(10);
            doc.text(`Biometrically Signed & Exported: ${new Date().toLocaleString()}`, 14, 28);
            autoTable(doc, {
              head: [headers],
              body: data,
              startY: 35,
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 2.5 },
              headStyles: { fillColor: [59, 130, 246] }
            });
            doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`);
          } else if (format === 'excel') {
            const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'SCM Ledger');
            XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.xlsx`);
          }
        });
      });
    });
  };

  // Core Actions
  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInventory)
      });
      if (res.ok) {
        setIsInventoryModalOpen(false);
        setNewInventory({ name: '', sku: '', category: 'Electronics', quantity: '100', unit: 'Units', warehouseId: warehouses[0]?.id || '', supplierId: suppliers[0]?.id || '', reorderPoint: '50', unitPrice: '10.00', barcode: '', batchNumber: '', expiryDate: '' });
        await fetchAllData();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to initialize inventory item');
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: newPO.supplierId,
          items: newPO.items.map(item => ({
            itemId: item.itemId,
            quantity: Number(item.quantity)
          }))
        })
      });
      if (res.ok) {
        setIsPOModalOpen(false);
        await fetchAllData();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to create purchase order');
    }
  };

  const handleCreateSO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newSO.customerName,
          items: newSO.items.map(item => ({
            itemId: item.itemId,
            quantity: Number(item.quantity)
          }))
        })
      });
      if (res.ok) {
        setIsSOModalOpen(false);
        setNewSO({ customerName: '', items: [{ itemId: inventory[0]?.id || '', quantity: '10' }] });
        await fetchAllData();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to create sales order');
    }
  };

  const handleMarkReceived = async (poId: string) => {
    try {
      const res = await authFetch(`/api/purchase-orders/${poId}/receive`, { method: 'POST' });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispatchSO = async (soId: string) => {
    try {
      const res = await authFetch(`/api/sales-orders/${soId}/dispatch`, { method: 'POST' });
      if (res.ok) {
        await fetchAllData();
      } else {
        const contentType = res.headers.get('content-type') || '';
        let errText = 'Failed to dispatch cargo';
        if (contentType.includes('application/json')) {
          try {
            const err = await res.json();
            errText = err.error || errText;
          } catch (_) {}
        }
        alert(errText);
      }
    } catch (e: any) {
      alert(e.message || 'Dispatch cargo failed');
    }
  };

  const handleCompleteSO = async (soId: string) => {
    try {
      const res = await authFetch(`/api/sales-orders/${soId}/complete`, { method: 'POST' });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const submitTelemetry = async () => {
    if (!selectedShipment) return;
    setTelemetrySubmitting(true);
    try {
      const res = await authFetch(`/api/shipments/${selectedShipment.id}/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp: simTemp,
          humidity: simHumidity,
          gForce: simGForce
        })
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const updated = await res.json();
            setSelectedShipment(updated);
          } catch (_) {}
        }
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTelemetrySubmitting(false);
    }
  };

  const generatePredictions = async () => {
    try {
      setPredictLoading(true);
      const res = await authFetch('/api/ai/predict-shortages');
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        setPredictions(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPredictLoading(false);
    }
  };

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    const promptToSend = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          history: chatMessages,
          provider: aiProvider,
          apiKey: aiApiKey,
          modelName: aiModelName,
          ragEnabled: aiRagEnabled,
          toolsEnabled: aiToolsEnabled
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.error) {
          setChatMessages(prev => [...prev, {
            id: 'err-' + Date.now(),
            role: 'assistant',
            content: `⚠️ Sentinel system log: ${data.error}`,
            timestamp: new Date().toISOString()
          }]);
        } else {
          setChatMessages(prev => [...prev, {
            id: 'res-' + Date.now(),
            role: 'assistant',
            content: data.content,
            timestamp: new Date().toISOString()
          }]);
          await fetchAllData();
        }
      } else {
        setChatMessages(prev => [...prev, {
          id: 'err-net-' + Date.now(),
          role: 'assistant',
          content: `⚠️ AI Sentinel operating in standby mode. If running on Vercel without serverless backend, configure VITE_API_URL.`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        id: 'err-net-' + Date.now(),
        role: 'assistant',
        content: `⚠️ Neural connection notice: ${err.message || 'Connection unavailable.'}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Quick preset triggers
  const setPresetColdChainViolation = () => {
    setSimTemp(27.5);
    setSimHumidity(48.0);
    setSimGForce(1.0);
  };
  const setPresetImpactViolation = () => {
    setSimTemp(19.0);
    setSimHumidity(44.0);
    setSimGForce(2.2);
  };
  const setPresetNormal = () => {
    setSimTemp(18.5);
    setSimHumidity(45.0);
    setSimGForce(1.01);
  };

  // Helper Derived Stats
  const totalAssets = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const activeShipments = shipments.filter(s => s.status === 'In Transit' || s.status === 'Pending').length;
  const lowStockCount = inventory.filter(item => item.quantity < 50).length;

  // Unauthenticated screen
  if (!currentUser || !token) {
    return (
      <LoginDashboard
        theme={theme}
        setTheme={setTheme}
        onLoginSuccess={(t, u) => {
          localStorage.setItem('nexus_token', t);
          localStorage.setItem('nexus_user', JSON.stringify(u));
          setToken(t);
          setCurrentUser(u);
        }}
      />
    );
  }

  // Authenticated Dashboard Layout Screen
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden flex transition-all duration-300">
      <BlockchainBackground />
      <IoTConnections />

      {/* Collagenous Sidebar component */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentUser={currentUser}
        handleLogout={handleLogout}
        theme={theme}
        setTheme={setTheme}
        currency={currency}
        setCurrency={setCurrency}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* top header */}
        <Header 
          currentUser={currentUser}
          token={token}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          lowStockCount={lowStockCount}
          activeShipments={activeShipments}
          theme={theme}
          setTheme={setTheme}
        />

        {/* Dynamic page container */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Error notifications */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between text-xs text-red-400 font-mono"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>[ALERT]: {errorMsg}</span>
                  </div>
                  <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Render selected view */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Role-Based Greeting Banner */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-blue-400 uppercase">
                            {currentUser?.role === 'ADMIN' ? 'ADMINISTRATIVE CONTROL CENTER' :
                             currentUser?.role === 'WAREHOUSE_MANAGER' ? 'WAREHOUSE OPERATIONS PORTAL' :
                             currentUser?.role === 'SUPPLIER' ? 'SUPPLIER INVENTORY & DISPATCH GATEWAY' :
                             'CUSTOMER ORDER & SHIPMENT TRACKING'}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold text-white mt-1 uppercase tracking-tight font-sans">
                          {currentUser?.role === 'ADMIN' ? 'Admin Dashboard' :
                           currentUser?.role === 'WAREHOUSE_MANAGER' ? 'Warehouse Dashboard' :
                           currentUser?.role === 'SUPPLIER' ? 'Supplier Dashboard' :
                           'Customer Dashboard'}
                        </h2>
                        <p className="text-slate-400 text-xs mt-0.5">
                          Welcome back, <span className="font-semibold text-slate-200">{currentUser?.username}</span>. Live synchronized logistics ledger online.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-mono font-bold uppercase">
                          {currentUser?.role || 'OPERATOR'}
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-mono font-bold uppercase">
                          {currentUser?.status || 'ACTIVE'}
                        </span>
                      </div>
                    </div>

                    {/* KPIs Row */}
                    <KPIs 
                      totalAssets={totalAssets}
                      currency={currency}
                      hubsCount={warehouses.length}
                      activeShipments={activeShipments}
                      lowStockCount={lowStockCount}
                    />

                    {/* Dashboard grid panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-4 h-full">
                        <AIAssistant 
                          chatMessages={chatMessages}
                          chatLoading={chatLoading}
                          chatInput={chatInput}
                          setChatInput={setChatInput}
                          sendChatMessage={sendChatMessage}
                          generatePredictions={generatePredictions}
                          predictLoading={predictLoading}
                          predictions={predictions}
                          aiProvider={aiProvider}
                          setAiProvider={setAiProvider}
                          aiApiKey={aiApiKey}
                          setAiApiKey={setAiApiKey}
                          aiModelName={aiModelName}
                          setAiModelName={setAiModelName}
                          aiRagEnabled={aiRagEnabled}
                          setAiRagEnabled={setAiRagEnabled}
                          aiToolsEnabled={aiToolsEnabled}
                          setAiToolsEnabled={setAiToolsEnabled}
                        />
                      </div>

                      {/* Stock forecasts and predictions */}
                      <div className="lg:col-span-8 bg-slate-950/20 border border-slate-800 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                          <div className="flex items-center gap-2">
                            <BrainCircuit className="w-4.5 h-4.5 text-blue-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Neural Shortage Forecasting model</h4>
                          </div>
                          <button
                            onClick={generatePredictions}
                            disabled={predictLoading}
                            className="px-3.5 py-1.5 rounded-lg font-mono text-[9px] font-bold tracking-wider uppercase bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/20 text-blue-400 hover:text-blue-300 transition cursor-pointer flex items-center gap-1.5"
                          >
                            {predictLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Forecast Model Run
                          </button>
                        </div>

                        <div className="space-y-3">
                          {predictions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 font-mono text-[10px]">
                              Awaiting neural predictive model execution. Trigger "Forecast Model Run" above.
                            </div>
                          ) : (
                            predictions.map((pred, i) => (
                              <div key={i} className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono items-center">
                                <div>
                                  <p className="font-bold text-slate-100">{pred.itemName}</p>
                                  <span className="text-[9px] text-slate-500">{pred.sku}</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-slate-500 text-[9px] block">FORECAST TO RESUPPLY:</span>
                                  <span className={`font-black uppercase ${pred.predictedDaysToStockout < 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {pred.predictedDaysToStockout} days remaining
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-black uppercase tracking-wide">
                                    {pred.recommendedAction}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'inventory' && (
                  <InventoryTable 
                    inventory={inventory}
                    warehouses={warehouses}
                    suppliers={suppliers}
                    currency={currency}
                    currentUser={currentUser}
                    onAddClick={() => setIsInventoryModalOpen(true)}
                    authFetch={authFetch}
                    fetchAllData={fetchAllData}
                  />
                )}

                {activeTab === 'shipments' && (
                  <LogisticsTelemetry 
                    shipments={shipments}
                    selectedShipment={selectedShipment}
                    setSelectedShipment={setSelectedShipment}
                    simTemp={simTemp}
                    setSimTemp={setSimTemp}
                    simHumidity={simHumidity}
                    setSimHumidity={setSimHumidity}
                    simGForce={simGForce}
                    setSimGForce={setSimGForce}
                    submitTelemetry={submitTelemetry}
                    telemetrySubmitting={telemetrySubmitting}
                    currentUser={currentUser}
                    setPresetNormal={setPresetNormal}
                    setPresetColdChainViolation={setPresetColdChainViolation}
                    setPresetImpactViolation={setPresetImpactViolation}
                    shipmentsSearch={shipmentsSearch}
                    setShipmentsSearch={setShipmentsSearch}
                  />
                )}

                {activeTab === 'directory' && (
                  <DirectoryNodes 
                    warehouses={warehouses}
                    suppliers={suppliers}
                    customers={customers}
                    inventory={inventory}
                    token={token}
                    currentUser={currentUser}
                  />
                )}

                {activeTab === 'orders' && (
                  <OrderBook 
                    purchaseOrders={purchaseOrders}
                    salesOrders={salesOrders}
                    currency={currency}
                    currentUser={currentUser}
                    handleMarkReceived={handleMarkReceived}
                    handleDispatchSO={handleDispatchSO}
                    handleCompleteSO={handleCompleteSO}
                    setIsPOModalOpen={setIsPOModalOpen}
                    setIsSOModalOpen={setIsSOModalOpen}
                    ordersSearch={ordersSearch}
                    setOrdersSearch={setOrdersSearch}
                  />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsDashboard 
                    inventory={inventory}
                    warehouses={warehouses}
                    suppliers={suppliers}
                    shipments={shipments}
                    currency={currency}
                    exportReport={exportReport}
                    selectedState={selectedState}
                    setSelectedState={setSelectedState}
                  />
                )}

                {activeTab === 'ledger' && (
                  <BlockchainLedger 
                    blockchain={blockchain}
                    ledgerVerification={ledgerVerification}
                    verifyLedger={verifyLedger}
                    tamperLedgerBlock={tamperLedgerBlock}
                    restoreLedgerChain={restoreLedgerChain}
                    isAddBlockOpen={isAddBlockOpen}
                    setIsAddBlockOpen={setIsAddBlockOpen}
                    newBlockForm={newBlockForm}
                    setNewBlockForm={setNewBlockForm}
                    handleCreateCustomBlock={handleCreateCustomBlock}
                    ethStatus={ethStatus}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsPanel 
                    currentUser={currentUser}
                    token={token}
                    theme={theme}
                    setTheme={setTheme}
                    currency={currency}
                    setCurrency={setCurrency}
                  />
                )}
              </motion.div>
            </AnimatePresence>

          </div>
        </main>
      </div>

      {/* Modal overlays */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-black text-slate-200 uppercase tracking-wider">Initialize Cryptographic Asset</h4>
              <button onClick={() => setIsInventoryModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateInventory} className="space-y-4 text-[11px]">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Item Name</label>
                  <input
                    type="text"
                    required
                    value={newInventory.name}
                    onChange={(e) => setNewInventory({ ...newInventory, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="Semiconductor Core"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={newInventory.sku}
                    onChange={(e) => setNewInventory({ ...newInventory, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="SKU-CHIP-9922"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Category</label>
                  <select
                    value={newInventory.category}
                    onChange={(e) => setNewInventory({ ...newInventory, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Electronics">Electronics Class</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Pharmaceuticals">Pharmaceuticals</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Quantity Pool</label>
                  <input
                    type="number"
                    required
                    value={newInventory.quantity}
                    onChange={(e) => setNewInventory({ ...newInventory, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Logistics Hub</label>
                  <select
                    value={newInventory.warehouseId}
                    onChange={(e) => setNewInventory({ ...newInventory, warehouseId: e.target.value })}
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
                    value={newInventory.supplierId}
                    onChange={(e) => setNewInventory({ ...newInventory, supplierId: e.target.value })}
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
                    type="text"
                    required
                    value={newInventory.unitPrice}
                    onChange={(e) => setNewInventory({ ...newInventory, unitPrice: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Reorder Safety Limit</label>
                  <input
                    type="number"
                    required
                    value={newInventory.reorderPoint}
                    onChange={(e) => setNewInventory({ ...newInventory, reorderPoint: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-gradient py-3 text-xs uppercase tracking-wider font-bold"
              >
                Sign & Launch On-Chain Asset
              </button>
            </form>
          </div>
        </div>
      )}

      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-black text-slate-200 uppercase tracking-wider">Generate Inbound Replenishment PO</h4>
              <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Select Supplier Node</label>
                <select
                  value={newPO.supplierId}
                  onChange={(e) => setNewPO({ ...newPO, supplierId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 focus:outline-none cursor-pointer"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 border-t border-slate-850 pt-3">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Asset Line Items</p>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-8 space-y-1">
                    <label className="text-slate-600 uppercase text-[8px] font-black">Select Asset</label>
                    <select
                      value={newPO.items[0].itemId}
                      onChange={(e) => {
                        const itemsCopy = [...newPO.items];
                        itemsCopy[0].itemId = e.target.value;
                        setNewPO({ ...newPO, items: itemsCopy });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-300 text-[11px] focus:outline-none"
                    >
                      {inventory.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4 space-y-1">
                    <label className="text-slate-600 uppercase text-[8px] font-black">Volume</label>
                    <input
                      type="number"
                      required
                      value={newPO.items[0].quantity}
                      onChange={(e) => {
                        const itemsCopy = [...newPO.items];
                        itemsCopy[0].quantity = e.target.value;
                        setNewPO({ ...newPO, items: itemsCopy });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 text-[11px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-gradient py-3 text-xs uppercase tracking-wider font-bold"
              >
                Assemble Cryptographic PO Block
              </button>
            </form>
          </div>
        </div>
      )}

      {isSOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 text-xs font-mono">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-black text-slate-200 uppercase tracking-wider">Launch Client Outbound Sales order</h4>
              <button onClick={() => setIsSOModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSO} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Client Entity Name</label>
                <input
                  type="text"
                  required
                  value={newSO.customerName}
                  onChange={(e) => setNewSO({ ...newSO, customerName: e.target.value })}
                  placeholder="Tesla Motors Inc"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 border-t border-slate-850 pt-3">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Asset Allocation</p>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-8 space-y-1">
                    <label className="text-slate-600 uppercase text-[8px] font-black">Select Asset</label>
                    <select
                      value={newSO.items[0].itemId}
                      onChange={(e) => {
                        const itemsCopy = [...newSO.items];
                        itemsCopy[0].itemId = e.target.value;
                        setNewSO({ ...newSO, items: itemsCopy });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-300 text-[11px] focus:outline-none"
                    >
                      {inventory.map(i => (
                        <option key={i.id} value={i.id}>{i.name} (Available: {i.quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4 space-y-1">
                    <label className="text-slate-600 uppercase text-[8px] font-black">Volume</label>
                    <input
                      type="number"
                      required
                      value={newSO.items[0].quantity}
                      onChange={(e) => {
                        const itemsCopy = [...newSO.items];
                        itemsCopy[0].quantity = e.target.value;
                        setNewSO({ ...newSO, items: itemsCopy });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 text-[11px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-gradient py-3 text-xs uppercase tracking-wider font-bold"
              >
                Sign & Generate Outbound SO Block
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
