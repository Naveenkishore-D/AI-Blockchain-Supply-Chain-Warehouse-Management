import React, { useState, useEffect, useRef } from 'react';
import { safeFetch } from '../lib/apiClient';
import { 
  Network, 
  ShieldCheck, 
  User as UserIcon, 
  Key, 
  Building2, 
  Package, 
  Users, 
  ArrowRight,
  Boxes,
  Globe,
  Radio,
  Database,
  Cpu,
  Loader2,
  AlertTriangle,
  Fingerprint,
  Activity,
  CheckCircle2,
  LockKeyhole,
  ChevronRight,
  Phone,
  Building,
  ArrowLeft
} from 'lucide-react';

interface LoginDashboardProps {
  theme: 'light' | 'dark';
  setTheme: (newTheme: 'light' | 'dark') => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginDashboard: React.FC<LoginDashboardProps> = ({
  theme,
  setTheme,
  onLoginSuccess
}) => {
  // Navigation modes: 'login' | 'register' | 'forgot' | 'reset'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  
  // Fields for Sign In
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Fields for Register
  const [fullNameInput, setFullNameInput] = useState('');
  const [emailRegInput, setEmailRegInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordRegInput, setPasswordRegInput] = useState('');
  const [confirmPasswordRegInput, setConfirmPasswordRegInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [roleInput, setRoleInput] = useState<'WAREHOUSE_MANAGER' | 'SUPPLIER' | 'CUSTOMER'>('WAREHOUSE_MANAGER');

  // Fields for Forgot Password / Reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status indicators
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background particle animation for elegant login feel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    class Dot {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.size = Math.random() * 1.5 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = '#93c5fd'; // Clean luminous light blue
        c.fill();
      }
    }

    const dots = Array.from({ length: 30 }, () => new Dot());

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.strokeStyle = `rgba(191, 219, 254, ${0.3 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      dots.forEach(d => {
        d.update();
        d.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Form Submissions
  const onSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);
    setLoading(true);

    try {
      const response = await safeFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Invalid credentials');
      }
      onLoginSuccess(response.data.token, response.data.user);
    } catch (err: any) {
      setLocalError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    if (passwordRegInput !== confirmPasswordRegInput) {
      setLocalError("Password does not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await safeFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullNameInput,
          email: emailRegInput,
          phone: phoneInput,
          password: passwordRegInput,
          confirmPassword: confirmPasswordRegInput,
          company: companyInput,
          role: roleInput
        })
      });

      if (!response.ok) {
        throw new Error(response.error || 'Registration failed');
      }
      setLocalSuccess("Registration successful. Your account is waiting for approval.");
      
      // Clean up fields
      setFullNameInput('');
      setEmailRegInput('');
      setPhoneInput('');
      setPasswordRegInput('');
      setConfirmPasswordRegInput('');
      setCompanyInput('');

      // Auto transition to login tab after success
      setTimeout(() => {
        setMode('login');
        setLocalSuccess(null);
      }, 5000);
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const onForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);
    setLoading(true);

    try {
      const response = await safeFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      if (!response.ok) {
        throw new Error(response.error || 'Email not found.');
      }
      setLocalSuccess("Password reset request received. Enter your new password below.");
      setMode('reset');
    } catch (err: any) {
      setLocalError(err.message || 'Email not found.');
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setLocalError("Password does not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await safeFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          newPassword,
          confirmPassword: confirmNewPassword
        })
      });

      if (!response.ok) {
        throw new Error(response.error || 'Password reset failed.');
      }
      setLocalSuccess("Password updated successfully.");
      
      setTimeout(() => {
        setMode('login');
        setLocalSuccess(null);
        setNewPassword('');
        setConfirmNewPassword('');
        setForgotEmail('');
      }, 3000);
    } catch (err: any) {
      setLocalError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans relative flex flex-col items-center justify-center p-4 md:p-8 select-none overflow-hidden">

      {/* SCM Subtle Light Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-70 z-0 pointer-events-none" />
      
      {/* Soft Ambient Glow Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/70 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-100/70 rounded-full blur-3xl pointer-events-none" />

      {/* Split Layout Box */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white rounded-3xl border border-blue-200/90 overflow-hidden shadow-2xl shadow-blue-500/10">
        
        {/* LEFT SECTION: Visual Brand Information in Rich Sapphire Blue */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white relative overflow-hidden border-r border-blue-200/40">
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-40 z-0" />
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/20">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-[0.25em] text-blue-200 uppercase">SYSTEMS MANAGEMENT</span>
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">NEXUS SCM</h1>
            </div>
          </div>

          <div className="my-10 relative z-10 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-semibold tracking-widest text-blue-100 uppercase bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20 inline-block">
                CORE MODULE
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                AI Supply Chain & Warehouse Management
              </h2>
              <p className="text-blue-100/90 text-sm leading-relaxed">
                NEXUS SCM bridges intelligent inventory analytics with robust multi-warehouse logistics. Register your node profile or authenticate to launch your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/15">
              <div className="flex gap-3 items-start bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <div className="p-2 rounded-lg bg-white/20 text-white">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Active Logistics</h4>
                  <p className="text-[10px] text-blue-100 mt-0.5">Automated hub operations</p>
                </div>
              </div>
              <div className="flex gap-3 items-start bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <div className="p-2 rounded-lg bg-emerald-400/20 text-emerald-300">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">Real-Time Trace</h4>
                  <p className="text-[10px] text-blue-100 mt-0.5">End-to-end supply tracking</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[10px] text-blue-200 font-mono tracking-wider uppercase border-t border-white/15 pt-4">
            <span>Enterprise Gateway Portal</span>
            <span>v4.1.2</span>
          </div>
        </div>

        {/* RIGHT SECTION: Clean White Auth Form Card with Blue Accents */}
        <div className="col-span-1 lg:col-span-6 flex flex-col justify-center p-8 md:p-12 bg-white relative">
          
          {/* Header branding on mobile view */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-blue-950 tracking-widest uppercase">NEXUS SCM</h2>
              <p className="text-[9px] text-blue-600 uppercase tracking-widest font-semibold">AI Supply Chain & Warehouse Management</p>
            </div>
          </div>

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-blue-600 uppercase">NEXUS SCM</span>
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-blue-950">Welcome Back</h3>
                <p className="text-xs text-slate-500">Please enter your registered credentials to sign in.</p>
              </div>

              <form onSubmit={onSignInSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-blue-950 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type="text"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/15 transition-all font-sans font-medium"
                      placeholder="email@nexus-scm.com or admin"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-blue-950 uppercase tracking-wider block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setLocalError(null);
                        setLocalSuccess(null);
                        setMode('forgot');
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/15 transition-all font-sans font-medium"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>

                {localError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{localError}</span>
                  </div>
                )}

                {localSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{localSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalError(null);
                      setLocalSuccess(null);
                      setMode('register');
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-blue-600 uppercase">REGISTRATION</span>
                <h3 className="text-2xl font-bold text-blue-950">Create Account</h3>
                <p className="text-xs text-slate-500">Register a new profile under the system directories.</p>
              </div>

              <form onSubmit={onRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-lg py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={emailRegInput}
                      onChange={(e) => setEmailRegInput(e.target.value)}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-lg py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-blue-600" />
                      <input
                        type="text"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full bg-blue-50/50 border border-blue-200 rounded-lg py-2.5 pl-9.5 pr-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordRegInput}
                      onChange={(e) => setPasswordRegInput(e.target.value)}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-lg py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      placeholder="Min. 6 characters"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPasswordRegInput}
                      onChange={(e) => setConfirmPasswordRegInput(e.target.value)}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-lg py-2.5 px-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                      Company/Organization
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-3.5 h-3.5 text-blue-600" />
                      <input
                        type="text"
                        required
                        value={companyInput}
                        onChange={(e) => setCompanyInput(e.target.value)}
                        className="w-full bg-blue-50/50 border border-blue-200 rounded-lg py-2.5 pl-9.5 pr-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        placeholder="Organization Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-950 uppercase tracking-wider block">
                      Assigned SCM Role
                    </label>
                    <select
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value as any)}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-lg py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    >
                      <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                      <option value="SUPPLIER">Material Supplier</option>
                      <option value="CUSTOMER">Consignee Customer</option>
                    </select>
                  </div>
                </div>

                {localError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{localError}</span>
                  </div>
                )}

                {localSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{localSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>CREATE PROFILE</span>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    setLocalSuccess(null);
                    setMode('login');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors flex items-center gap-2 justify-center mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-blue-600 uppercase">ACCESS RECOVERY</span>
                <h3 className="text-2xl font-bold tracking-tight text-blue-950">Forgot Password</h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Enter your registered email address below. If located, you will be prompted to choose a new password instantly.
                </p>
              </div>

              <form onSubmit={onForgotSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-blue-950 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-blue-600" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/15 transition-all font-sans font-medium"
                      placeholder="registered-email@company.com"
                    />
                  </div>
                </div>

                {localError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{localError}</span>
                  </div>
                )}

                {localSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{localSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>FIND ACCOUNT</span>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    setLocalSuccess(null);
                    setMode('login');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors flex items-center gap-2 justify-center mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Login
                </button>
              </div>
            </div>
          )}

          {/* MODE: RESET PASSWORD */}
          {mode === 'reset' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-blue-600 uppercase">PASSWORD SETTING</span>
                <h3 className="text-2xl font-bold tracking-tight text-blue-950">Choose New Password</h3>
                <p className="text-xs text-slate-500">
                  Update the password signature for account <strong>{forgotEmail}</strong>.
                </p>
              </div>

              <form onSubmit={onResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-blue-950 uppercase tracking-wider block">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl py-3 px-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/15 transition-all font-sans font-medium"
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-blue-950 uppercase tracking-wider block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl py-3 px-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/15 transition-all font-sans font-medium"
                    placeholder="Repeat new password"
                  />
                </div>

                {localError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{localError}</span>
                  </div>
                )}

                {localSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{localSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>UPDATE PASSWORD</span>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLocalError(null);
                    setLocalSuccess(null);
                    setMode('login');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors flex items-center gap-2 justify-center mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cancel Reset
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
