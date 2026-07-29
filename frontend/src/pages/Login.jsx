import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Loader2, Info } from 'lucide-react';

const Login = () => {
  const { login, user, error: authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setErr('Please complete all fields');
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

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center font-sans p-4 relative overflow-hidden">
      
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in z-10">
        
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg font-bold text-white text-xl">
            A
          </div>
          <span className="font-extrabold text-[10px] tracking-[0.25em] text-primary-400 uppercase font-mono mt-3 leading-none">AI-Driven</span>
          <h1 className="text-lg font-black text-white mt-1 font-sans uppercase tracking-tight">Stock Intelligence</h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider text-center">Predictive Decision Support</p>
        </div>

        {/* Auth Glassmorphic Card */}
        <div className="glass p-8 rounded-3xl shadow-glass-dark border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-6">Sign in to your account</h2>

          {(err || authError) && (
            <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              ⚠️ {err || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@smartstock.com"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-primary-500 placeholder-slate-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-primary-500 placeholder-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold text-xs rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary-900/15"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            Don't have a company account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
              Register Company
            </Link>
          </div>
        </div>

        {/* Preset accounts assistance box */}
        <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-3 text-xs leading-normal">
          <Info size={18} className="text-primary-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-[10px] text-slate-400">
            <span className="font-semibold text-slate-200 text-xs">Demo Credentials (Seeded):</span>
            <span>🔑 **Admin**: `admin@smartstock.com` / `admin123`</span>
            <span>🔑 **Manager**: `manager@smartstock.com` / `manager123`</span>
            <span>🔑 **Branch Staff**: `staff@smartstock.com` / `staff123`</span>
            <span>🔑 **Branch User**: `branch@smartstock.com` / `branch123`</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
