import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RotateCw, 
  PlusCircle, 
  Search, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  Lock,
  Boxes,
  HelpCircle
} from 'lucide-react';
import { BlockchainBlock } from '../types';

interface BlockchainLedgerProps {
  blockchain: BlockchainBlock[];
  ledgerVerification: { verified: boolean; totalBlocks: number; errors: string[] } | null;
  verifyLedger: () => void;
  tamperLedgerBlock: (index: number, newDetails: string) => void;
  restoreLedgerChain: () => void;
  isAddBlockOpen: boolean;
  setIsAddBlockOpen: (open: boolean) => void;
  newBlockForm: {
    action: string;
    entityId: string;
    entityType: string;
    details: string;
    operator: string;
    trackingCode: string;
  };
  setNewBlockForm: any;
  handleCreateCustomBlock: (e: React.FormEvent) => void;
  ethStatus: {
    connected: boolean;
    walletAddress: string;
    contractAddress: string;
    network: string;
  } | null;
}

export const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({
  blockchain,
  ledgerVerification,
  verifyLedger,
  tamperLedgerBlock,
  restoreLedgerChain,
  isAddBlockOpen,
  setIsAddBlockOpen,
  newBlockForm,
  setNewBlockForm,
  handleCreateCustomBlock,
  ethStatus
}) => {
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Filter blocks
  const filteredBlockchain = blockchain.filter(b => {
    if (!ledgerSearch) return true;
    const query = ledgerSearch.toLowerCase();
    return (
      b.data.action.toLowerCase().includes(query) ||
      b.data.entityId.toLowerCase().includes(query) ||
      b.data.entityType.toLowerCase().includes(query) ||
      b.data.details.toLowerCase().includes(query) ||
      b.data.operator.toLowerCase().includes(query) ||
      b.hash.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6" id="ledger-view">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Decentralized SCM Cryptographic Ledger</h3>
          <p className="text-xs text-slate-500 font-mono mt-1">Immutable ledger events synchronizing supply chain transactions.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={verifyLedger}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/20 rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Verify Integrity
          </button>
 
          <button
            onClick={() => setIsAddBlockOpen(!isAddBlockOpen)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/20 rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Publish Manual Block
          </button>
 
          {ledgerVerification && !ledgerVerification.verified && (
            <button
               onClick={restoreLedgerChain}
               className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/20 rounded-xl font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
             >
               <RotateCw className="w-4 h-4" />
               Restore Ledger state
             </button>
           )}
         </div>
       </div>
 
       {/* Verification Status Banner */}
       {ledgerVerification && (
         <div className={`p-4 rounded-2xl border text-xs font-mono transition-all duration-300 ${
           ledgerVerification.verified 
             ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
             : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
         }`}>
           <div className="flex items-start gap-3">
             <div className={`p-2 rounded-xl ${ledgerVerification.verified ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
               {ledgerVerification.verified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5 animate-pulse" />}
             </div>
             <div className="space-y-1">
               <p className="text-[11px] font-black uppercase tracking-widest">
                 Ledger Verification: {ledgerVerification.verified ? '✅ SECURE / PRISTINE STATE' : '❌ HACKED / SYSTEM COMPROMISED'}
               </p>
               <p className="text-[10px] text-slate-500 uppercase leading-relaxed">
                 {ledgerVerification.verified 
                   ? `All ${ledgerVerification.totalBlocks} hash links match their mathematical signatures perfectly. Supply chain integrity verified.` 
                   : `Hacking attempt detected! Cryptographic hash chain broken: ${ledgerVerification.errors.join(', ')}`
                 }
               </p>
             </div>
           </div>
         </div>
       )}
 
       {/* Manual block creation form overlay */}
       {isAddBlockOpen && (
         <form onSubmit={handleCreateCustomBlock} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Assemble Cryptographic Block Data</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Action Type</label>
               <input
                 type="text"
                 value={newBlockForm.action}
                 onChange={(e) => setNewBlockForm({ ...newBlockForm, action: e.target.value })}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                 required
               />
             </div>
             <div>
               <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Entity ID Ref</label>
               <input
                 type="text"
                 value={newBlockForm.entityId}
                 onChange={(e) => setNewBlockForm({ ...newBlockForm, entityId: e.target.value })}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                 required
               />
             </div>
             <div>
               <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Entity Domain</label>
               <select
                 value={newBlockForm.entityType}
                 onChange={(e) => setNewBlockForm({ ...newBlockForm, entityType: e.target.value })}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
               >
                 <option value="Inventory" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">Inventory (Storage SKU)</option>
                 <option value="Shipment" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">Shipment (IoT Cargo)</option>
                 <option value="PurchaseOrder" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">PurchaseOrder (Sourcing)</option>
                 <option value="SalesOrder" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">SalesOrder (Protocol)</option>
               </select>
             </div>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Block Details / Operation Log Msg</label>
               <input
                 type="text"
                 value={newBlockForm.details}
                 onChange={(e) => setNewBlockForm({ ...newBlockForm, details: e.target.value })}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-sans focus:outline-none focus:border-blue-500"
                 required
               />
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Authorized Operator</label>
                 <input
                   type="text"
                   value={newBlockForm.operator}
                   onChange={(e) => setNewBlockForm({ ...newBlockForm, operator: e.target.value })}
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                   required
                 />
               </div>
               <div>
                 <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 block mb-1">Tracking Code</label>
                 <input
                   type="text"
                   value={newBlockForm.trackingCode}
                   onChange={(e) => setNewBlockForm({ ...newBlockForm, trackingCode: e.target.value })}
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                   required
                 />
               </div>
             </div>
           </div>
 
           <button
             type="submit"
             className="btn-gradient w-full py-3"
           >
             Sign & Publish Block To Decentralized Ledger
           </button>
         </form>
       )}
 
       {/* Ethereum ganache status bar */}
       {ethStatus && (
         <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs items-center shadow-sm">
           <div className="space-y-1">
             <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Web3j status</span>
             <div className="flex items-center gap-2">
               <span className={`w-2.5 h-2.5 rounded-full ${ethStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
               <span className={`font-bold uppercase ${ethStatus.connected ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500'}`}>
                 {ethStatus.connected ? 'ACTIVE (LIVE WEB3)' : 'GANACHE SIMULATED'}
               </span>
             </div>
           </div>
           
           <div className="space-y-1">
             <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Solidity Contract Address</span>
             <span className="text-slate-700 dark:text-slate-300 block truncate font-mono select-all text-[11px]" title={ethStatus.contractAddress}>
               {ethStatus.contractAddress}
             </span>
           </div>
 
           <div className="space-y-1 font-mono">
             <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Web3j Wallet Address</span>
             <span className="text-slate-700 dark:text-slate-300 block truncate font-mono select-all text-[11px]" title={ethStatus.walletAddress}>
               {ethStatus.walletAddress}
             </span>
           </div>
 
           <div className="space-y-1">
             <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Network Endpoint</span>
             <span className="text-slate-600 dark:text-slate-400 block truncate">{ethStatus.network}</span>
           </div>
         </div>
       )}
 
       {/* Block search filter input */}
       <div className="relative w-full">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
         <input
           type="text"
           placeholder="Query cryptographic blocks by SHA-256 signature, action type, or authorized operator ID..."
           value={ledgerSearch}
           onChange={(e) => setLedgerSearch(e.target.value)}
           className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
         />
       </div>
 
       {/* Grid of Block Cards */}
       <div className="space-y-4">
         {filteredBlockchain.map((block) => (
           <div 
             key={block.index} 
             className="bg-white dark:bg-slate-950/25 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all relative overflow-hidden shadow-sm"
           >
             <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
               <Boxes className="w-48 h-48" />
             </div>
 
             <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900 mb-3 text-xs">
               <div className="flex items-center gap-3">
                 <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">#BLOCK {block.index}</span>
                 <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[9px] rounded uppercase font-black tracking-wider border border-slate-200 dark:border-slate-850">
                   {block.data.action}
                 </span>
               </div>
               <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{new Date(block.timestamp).toLocaleString()}</span>
             </div>
 
             <div className="space-y-2.5 mb-3">
               <p className="text-slate-800 dark:text-slate-200 font-sans text-xs font-semibold">{block.data.details}</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                 <div>
                   <span className="text-slate-400 dark:text-slate-600 uppercase font-black text-[9px] tracking-wider block mb-0.5">Associated Entity:</span>
                   <span className="text-slate-700 dark:text-slate-300">{block.data.entityType} ({block.data.entityId})</span>
                 </div>
                 <div>
                   <span className="text-slate-400 dark:text-slate-600 uppercase font-black text-[9px] tracking-wider block mb-0.5">Authorized Operator:</span>
                   <span className="text-slate-700 dark:text-slate-300">{block.data.operator}</span>
                 </div>
               </div>
             </div>
 
             <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-slate-500 font-mono">
               <div>
                 <span className="text-slate-400 dark:text-slate-600 uppercase font-black text-[8px] tracking-widest block mb-0.5">SHA-256 block hash:</span>
                 <span className="text-slate-500 dark:text-slate-400 select-all block break-all">{block.hash}</span>
               </div>
               <div>
                 <span className="text-slate-400 dark:text-slate-600 uppercase font-black text-[8px] tracking-widest block mb-0.5">Signature:</span>
                 <span className="text-emerald-600 dark:text-emerald-400 select-all block break-all">{block.signature}</span>
               </div>
             </div>
 
             {block.ethTxHash && (
               <div className="mt-3.5 pt-3 bg-emerald-950/10 border border-emerald-500/10 rounded-xl p-3 text-[10px] font-mono space-y-1">
                 <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-[9px]">
                   <Cpu className="w-3.5 h-3.5 animate-pulse" />
                   <span className="uppercase tracking-widest">Ethereum smart contract receipt</span>
                   <span className="bg-emerald-900/40 text-emerald-300 text-[8px] px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-black">
                     {block.ethStatus || 'RECORDED'}
                   </span>
                 </div>
                 <div className="pt-1.5 grid grid-cols-1 md:grid-cols-3 gap-2">
                   <div className="col-span-2">
                     <span className="text-slate-400 dark:text-slate-600 uppercase font-black text-[8px] tracking-wider block mb-0.5">Transaction Hash:</span>
                     <span className="text-emerald-600 dark:text-emerald-400 select-all block break-all">{block.ethTxHash}</span>
                   </div>
                   <div className="border-l border-slate-200 dark:border-slate-900 pl-3">
                     <span className="text-slate-400 dark:text-slate-600 uppercase font-black text-[8px] tracking-wider block mb-0.5">Block Height:</span>
                     <span className="text-slate-700 dark:text-slate-300 font-bold">#{block.ethBlockNumber || 'Pending'}</span>
                   </div>
                 </div>
               </div>
             )}
 
             {/* Demonstrating security tamper button */}
             <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center text-[10px]">
               <span className="text-slate-400 dark:text-slate-600 uppercase tracking-widest font-bold">Quantum ledger compliance</span>
               <button
                 onClick={() => {
                   const val = prompt("Perform simulation modification for Block #" + block.index + ":", "MALICIOUS DISRUPTIVE TAMPER: Infiltrated database entry modified manually!");
                   if (val) {
                     tamperLedgerBlock(block.index, val);
                   }
                 }}
                 className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg border border-rose-500/20 hover:border-rose-500 text-[9px] font-bold uppercase font-mono tracking-wider transition-all duration-200 cursor-pointer"
               >
                 Tamper Block Data
               </button>
             </div>
           </div>
         ))}
       </div>
     </div>
  );
};
