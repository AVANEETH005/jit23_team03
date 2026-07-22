import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Loader2, Info } from 'lucide-react';

const Register = () => {
  const { register, user, error: authError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin', // default to admin to provision company
    companyCode: '',
    companyName: '',
    branchName: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, role } = formData;
    if (!name || !email || !password || !role) {
      return setErr('Please complete all required fields');
    }

    setErr('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/');
    } catch (error) {
      setErr(error.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center font-sans p-4 relative overflow-hidden">
      
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg animate-fade-in z-10 my-8 overflow-y-auto max-h-[90vh]">
        
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg font-bold text-white text-lg">
            S
          </div>
          <h1 className="text-lg font-bold text-white mt-3 font-sans">Smart Stock Registration</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Provision Company or Join Existing Workspace</p>
        </div>

        {/* Register Glassmorphic Card */}
        <div className="glass p-8 rounded-3xl shadow-glass-dark border border-slate-800">
          
          {(err || authError) && (
            <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold">
              ⚠️ {err || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-primary-500 placeholder-slate-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@company.com"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-primary-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-primary-500 placeholder-slate-700"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">User Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-primary-500"
                >
                  <option value="admin">Admin (Company Owner)</option>
                  <option value="manager">Manager (Company wide)</option>
                  <option value="staff">Staff (Branch operator)</option>
                  <option value="branch_user">Branch User (Branch Admin)</option>
                </select>
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-slate-800 my-2" />

            {/* Company setup options info */}
            <div className="bg-slate-900/40 p-3 rounded-2xl border border-slate-800 flex gap-2">
              <Info size={14} className="text-primary-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-normal">
                To **create a new company**, leave "Company Code" empty and fill "Company Name". To **join an existing company**, type their unique 5-7 digit Company Code (e.g. SLI2026).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Company Code (To Join)</label>
                <input
                  type="text"
                  name="companyCode"
                  value={formData.companyCode}
                  onChange={handleChange}
                  placeholder="e.g. SLI2026"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-primary-500 placeholder-slate-700 uppercase"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">New Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Nexus Logistics"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-primary-500 placeholder-slate-700"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Initial Branch Name (Optional)</label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                placeholder="e.g. Main Warehouse or Branch A"
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
                  Provisioning Workspace...
                </>
              ) : (
                'Create Account & Workspace'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
              Sign in
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
