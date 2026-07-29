import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Loader2, 
  Cpu, 
  TrendingUp, 
  Boxes, 
  AlertTriangle, 
  Mail, 
  Phone,
  Key, 
  Play, 
  CheckCircle2,
  Server,
  Layers,
  ArrowRight,
  UserCheck,
  X
} from 'lucide-react';

const Home = () => {
  const { login, loginWithOtp, register, user, error: authError } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Authentication tabs: 'login', 'register'
  const [authTab, setAuthTab] = useState('login');
  // Login modes: 'email', 'otp'
  const [loginMode, setLoginMode] = useState('email');

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Register state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    companyCode: '',
    companyName: '',
    branchName: '',
    phone: ''
  });

  const [registerOtpSent, setRegisterOtpSent] = useState(false);
  const [registerOtpInput, setRegisterOtpInput] = useState('');
  const [registerOtpTimer, setRegisterOtpTimer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Diagnostics / System Metrics
  const [sysMetrics, setSysMetrics] = useState({
    activeUsers: 14,
    apiLoad: '1.2%',
    inspectQueue: 0,
    dbSync: 'Active'
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Systems diagnostics simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSysMetrics(prev => ({
        activeUsers: Math.max(12, Math.min(24, prev.activeUsers + (Math.random() > 0.5 ? 1 : -1))),
        apiLoad: (0.8 + Math.random() * 1.5).toFixed(1) + '%',
        inspectQueue: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : prev.inspectQueue,
        dbSync: 'Active'
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0 && otpSent) {
      setOtpSent(false);
    }
  }, [otpTimer, otpSent]);

  useEffect(() => {
    if (registerOtpTimer > 0) {
      const timer = setTimeout(() => setRegisterOtpTimer(registerOtpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (registerOtpTimer === 0 && registerOtpSent) {
      setRegisterOtpSent(false);
    }
  }, [registerOtpTimer, registerOtpSent]);

  // High-Tech animated background particle canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = [];
    for (let i = 0; i < 48; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid overlay lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.25)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw particle network connections
      ctx.fillStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
      ctx.lineWidth = 1.2;

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Show Toast helper
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 5500);
  };

  // 1. Handle normal credentials login
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setErr('Please enter both email and password.');
    }
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setErr(error.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle OTP generation via backend POST
  const handleSendOtp = async () => {
    const targetEmail = loginMode === 'email' ? email : phone;
    if (!targetEmail) {
      return setErr('Please enter an email address or mobile number.');
    }

    setErr('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes expiration
        
        let msg = `WMS Real-time OTP Sent! Check your backend server terminal logs.`;
        if (data.emailUrl) {
          console.log(`[SMTP Mail] Ethereal mail link: ${data.emailUrl}`);
        }
        triggerToast(msg);
      } else {
        setErr(data.message || 'Failed to send OTP verification code.');
      }
    } catch (err) {
      console.error(err);
      setErr('Failed to connect to authentication gateway.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle OTP Verification via AuthContext and Backend Session validation
  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    const targetEmail = loginMode === 'email' ? email : phone;
    if (!userOtpInput) {
      return setErr('Please enter the verification OTP.');
    }

    setErr('');
    setLoading(true);
    try {
      await loginWithOtp(targetEmail, userOtpInput);
      navigate('/');
    } catch (error) {
      setErr(error.message || 'Invalid OTP verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRegisterOtp = async () => {
    const { name, email, password, role, phone } = registerForm;
    if (!name || !email || !password || !role) {
      return setErr('Please complete all required fields (Name, Email, Password, Role) before requesting OTP.');
    }
    if (!phone) {
      return setErr('Please enter your Phone Number to receive the mobile OTP verification code.');
    }
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });
      const data = await res.json();
      if (res.ok) {
        setRegisterOtpSent(true);
        setRegisterOtpTimer(300); // 5 minutes
        let msg = `Real-time OTP Sent! Check your email and server terminal logs.`;
        if (data.emailUrl) {
          msg += ` Ethereal mail link logged in console.`;
        }
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 8000);
      } else {
        setErr(data.message || 'Failed to send OTP verification code.');
      }
    } catch (err) {
      console.error(err);
      setErr('Failed to connect to the authorization server.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Registration Workspace provision
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, role } = registerForm;
    if (!name || !email || !password || !role) {
      return setErr('Please complete all required registry fields.');
    }
    setErr('');
    setLoading(true);
    try {
      await register(registerForm);
      navigate('/');
    } catch (error) {
      setErr(error.message || 'Registry failed. Try a different email workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      
      {/* Background Interactive Particles Network */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Decorative ambient blurred orb lights */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Toast Notification Box */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in max-w-sm w-full bg-slate-900/90 border border-blue-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex gap-2.5 items-start">
          <Key className="text-blue-400 shrink-0 mt-0.5" size={16} />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white uppercase tracking-wider">SMS / Email Verification Gateway</span>
            <span className="text-[11px] text-slate-300 mt-1 font-mono leading-relaxed">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER BRAND BAR */}
      <header className="w-full h-20 border-b border-slate-900/60 flex items-center justify-between px-6 md:px-12 backdrop-blur-md bg-slate-950/45 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg font-bold text-white text-lg">
            A
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-[9px] tracking-[0.2em] text-blue-400 uppercase font-mono leading-none">AI-Driven</span>
            <span className="font-black text-sm tracking-tight text-white font-sans uppercase mt-0.5">Stock Intelligence</span>
            <span className="text-[8px] text-slate-400 font-sans uppercase tracking-wider leading-none mt-0.5">Predictive Decision Support</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              const el = document.getElementById('features-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-colors hidden sm:inline-block bg-transparent border-0 outline-none"
          >
            Features
          </button>
          <button 
            onClick={() => setStatusModalOpen(true)}
            className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer transition-colors hidden sm:inline-block bg-transparent border-0 outline-none"
          >
            System Status
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-slate-350 hover:text-white px-3.5 py-1.5 border border-slate-800 rounded-xl bg-slate-900/40 transition-all"
          >
            Docs v1.0.4
          </a>
        </div>
      </header>

      {/* MAIN CONTAINER: Hero & Authentication split panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-6 md:px-12 py-10 z-10">
        
        {/* LEFT COLUMN: HERO INFORMATION PANEL (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded-full tracking-wider self-start animate-fade-in">
            <Cpu size={12} className="animate-pulse" /> Advanced Agentic Engine Integration
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-sans leading-[1.1]">
            AI - Driven Automated <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
              Stock Intelligence
            </span>
            <div className="text-[10px] md:text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase font-sans mt-3">
              With Predictive Decision Support
            </div>
          </h2>

          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-xl">
            Integrates YOLOv8 object identification, real-time packaging defect inspections, voice narration triggers, and automated transfer requests under one secure Workspace.
          </p>

          {/* Core Features grid list */}
          <div id="features-section" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            
            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex gap-3 items-start hover:border-slate-800 transition-all group">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400 group-hover:scale-105 transition-all">
                <AlertTriangle size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">YOLOv8 QA Inspector</span>
                <span className="text-[10px] text-slate-400 mt-1">Inspects items for cracks, dents, and package tears at 70%+ confidence.</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex gap-3 items-start hover:border-slate-800 transition-all group">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-400 group-hover:scale-105 transition-all">
                <TrendingUp size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">AI Demand Forecasting</span>
                <span className="text-[10px] text-slate-400 mt-1">Anticipates depletion thresholds using mathematical regression.</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex gap-3 items-start hover:border-slate-800 transition-all group">
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400 group-hover:scale-105 transition-all">
                <Boxes size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Real-Time Sync</span>
                <span className="text-[10px] text-slate-400 mt-1">Multi-branch stock transfer pipelines and automated quarantine.</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-2xl flex gap-3 items-start hover:border-slate-800 transition-all group">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-400 group-hover:scale-105 transition-all">
                <Server size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">System Statistics HUD</span>
                <span className="text-[10px] text-slate-400 mt-1">Visual diagnostics console mapping active requests and latency.</span>
              </div>
            </div>

          </div>

          {/* DIAGNOSTIC METRICS CARD */}
          <div className="mt-4 p-5 bg-slate-950/80 border border-slate-850 rounded-2xl flex items-center justify-between text-xs font-mono max-w-xl shadow-inner">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase">Gateway Sync</span>
              <span className="text-white font-bold mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> {sysMetrics.dbSync}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase">API Load</span>
              <span className="text-blue-400 font-bold mt-1">{sysMetrics.apiLoad}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase">Live Operators</span>
              <span className="text-white font-bold mt-1">{sysMetrics.activeUsers}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase">QA Queue</span>
              <span className="text-amber-500 font-bold mt-1">{sysMetrics.inspectQueue} inspects</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: GLASSMORPHIC AUTHENTICATION CONSOLE (5 Cols) */}
        <div className="lg:col-span-5 w-full flex flex-col gap-4">
          
          <div className="glass p-6 md:p-8 rounded-3xl border border-slate-800 shadow-glass-dark relative flex flex-col gap-6">
            
            {/* Form Toggle Header */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 w-full">
              <button
                onClick={() => {
                  setAuthTab('login');
                  setErr('');
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthTab('register');
                  setErr('');
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                New Workspace
              </button>
            </div>

            {/* Error notifications */}
            {(err || authError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
                ⚠️ {err || authError}
              </div>
            )}
            {/* LOGIN FORM TAB */}
            {authTab === 'login' && (
              <div className="flex flex-col gap-4">
                
                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. admin@smartstock.com"
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-650"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-slate-900 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/10"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In with Password <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                {/* Preset Fast Login Credentials for testing */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900 mt-2 text-[10px] text-slate-500 leading-normal">
                  <span className="font-bold text-slate-400 block mb-0.5">Demo Presets:</span>
                  Login: <span className="font-semibold text-slate-350">admin@smartstock.com</span> / password: <span className="font-semibold text-slate-350">admin123</span>
                </div>

              </div>
            )}

            {/* REGISTER ACCOUNT FORM TAB */}
            {authTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                      placeholder="John Doe"
                      className="bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-600"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      placeholder="john@work.com"
                      className="bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      placeholder="••••••••"
                      className="bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-700"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Account Role</label>
                    <select
                      value={registerForm.role}
                      onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
                      className="bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                    >
                      <option value="admin">Admin (Company Owner)</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff Operator</option>
                    </select>
                  </div>
                </div>

                <div className="h-px bg-slate-900 my-1" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Company Name</label>
                    <input
                      type="text"
                      value={registerForm.companyName}
                      onChange={(e) => setRegisterForm({...registerForm, companyName: e.target.value})}
                      placeholder="Nexus Logi"
                      className="bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-700"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Join Code (Optional)</label>
                    <input
                      type="text"
                      value={registerForm.companyCode}
                      onChange={(e) => setRegisterForm({...registerForm, companyCode: e.target.value})}
                      placeholder="e.g. SLI2026"
                      className="bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 placeholder-slate-700 uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/10"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Create Workspace
                </button>
              </form>
            )}

          </div>

        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="w-full py-6 border-t border-slate-900/40 text-center text-[10px] text-slate-500 z-10 bg-slate-950/20">
        © 2026 AI-Driven Stock Intelligence (Predictive Decision Support) Inc. Developed as a premium enterprise quality assurance logistics platform. All rights reserved.
      </footer>

      {/* SYSTEM STATUS DIAGNOSTIC MODAL */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl text-slate-100">
            <button
              onClick={() => setStatusModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer h-7 w-7 rounded-lg hover:bg-slate-850 flex items-center justify-center transition-colors border-0 bg-transparent outline-none"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 absolute" />
              <h3 className="text-sm font-bold tracking-tight uppercase ml-4 text-white">System Diagnostics Panel</h3>
            </div>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Live status report of microservices and hardware integration nodes for the AI-Driven Stock Intelligence platform.
            </p>

            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <span className="text-xs font-semibold">WMS Node Server API</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">ONLINE (12ms)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <span className="text-xs font-semibold">MongoDB Atlas Database</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <span className="text-xs font-semibold">FastAPI YOLOv11 Engine</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <span className="text-xs font-semibold">Google Gemini AI Engine</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">AUTHORIZED (gemini-3.5)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-950 rounded-xl">
                <span className="text-xs font-semibold">SMTP Verification Relay</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">ACTIVE</span>
              </div>
            </div>

            <button
              onClick={() => setStatusModalOpen(false)}
              className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer outline-none"
            >
              CLOSE DIAGNOSTICS
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
