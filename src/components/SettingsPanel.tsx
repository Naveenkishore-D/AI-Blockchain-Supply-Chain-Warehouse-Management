import React from 'react';
import { 
  Terminal, 
  Database, 
  ShieldCheck, 
  Cpu, 
  Key, 
  BookOpen, 
  Activity,
  FileCode,
  Lock,
  Sun,
  Moon,
  Globe,
  Sliders
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SettingsPanelProps {
  currentUser: { id: number; username: string; email: string; role: string } | null;
  token: string | null;
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
  currency?: 'USD' | 'INR';
  setCurrency?: React.Dispatch<React.SetStateAction<'USD' | 'INR'>>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  currentUser,
  token,
  theme,
  setTheme,
  currency,
  setCurrency
}) => {

  const apiEndpoints = [
    { method: 'POST', path: '/api/auth/register', desc: 'Register a new operator with biometrics and secret tokens' },
    { method: 'POST', path: '/api/auth/login', desc: 'Authenticate credentials and generate Web3 transport signatures' },
    { method: 'GET', path: '/api/inventory', desc: 'Query full, untampered SKU records from the persistent datastore' },
    { method: 'POST', path: '/api/inventory', desc: 'Propose a new on-chain asset (Authorized roles only)' },
    { method: 'POST', path: '/api/blockchain/verify', desc: 'Perform quantum hash validation checks across the ledger nodes' },
    { method: 'POST', path: '/api/ai/chat', desc: 'Interact directly with the Gemini neural supply chain assistant' }
  ];

  return (
    <div className="space-y-8" id="settings-view">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: API Documentation */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">RESTful Node API Reference</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">Developers can query system logs and ledger blocks via REST calls.</p>
          </div>

          <div className="space-y-4">
            {apiEndpoints.map((endpoint, i) => (
              <div key={i} className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black ${
                    endpoint.method === 'POST' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-xs font-mono text-slate-800 dark:text-slate-200 select-all">{endpoint.path}</code>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed pl-1">
                  {endpoint.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Security diagnostic credentials */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 font-mono">Quantum Cryptographic Diagnostics</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">Credentials and biometric signature payloads.</p>
          </div>

          <div className="bg-white/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-5 font-mono text-xs text-slate-600 dark:text-slate-400">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-black block">Active Handshake Session Token</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-850 break-all text-[10px] font-mono text-slate-700 dark:text-slate-300">
                {token || 'UNAUTHORIZED // ANONYMOUS SESSION'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-black block">Authorized Operator Role Scope</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{currentUser?.role || 'Guest Node Access'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-black block">System Security Standards</span>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SHA-256 Ledger Mining (Simulated)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Google Gemini 2.5 Pro Neural Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>Live Telemetry Broadcast Receiver Enabled</span>
                </div>
              </div>
            </div>
          </div>
          {/* Preferences */}
          {theme && setTheme && (
            <div className="bg-white/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  User Preferences
                </h4>
              </div>

              <div className="space-y-3">
                {/* Preference: Dark Mode Toggle */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-850 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        theme === 'dark' 
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Dark Mode</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {theme === 'dark' ? 'Dark theme active' : 'Light theme active'} • One-click switch
                        </span>
                      </div>
                    </div>
                    <ThemeToggle theme={theme} onToggle={setTheme} showLabel />
                  </div>

                  {/* Icon attribution reference */}
                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 dark:text-slate-500">
                    <a 
                      href="https://www.flaticon.com/free-icons/dark-mode" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      title="dark mode icons"
                      className="hover:text-blue-500 transition-colors underline decoration-slate-300 dark:decoration-slate-700"
                    >
                      Dark mode icons created by mpanicon - Flaticon
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
