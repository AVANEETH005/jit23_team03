import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Building2, 
  Bell, 
  Moon, 
  Sun, 
  ShieldCheck, 
  CheckCircle2 
} from 'lucide-react';

const Settings = () => {
  const { user, updateProfile, activeBranchId, setActiveBranchId } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Notification toggles
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(true);
  const [transferAlerts, setTransferAlerts] = useState(true);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const payload = { name, email };
      if (password) payload.password = password;

      await updateProfile(payload);
      setSuccessMsg('Profile settings updated successfully!');
      setPassword('');
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-primary-400 font-semibold text-xs uppercase tracking-widest">
            <SettingsIcon size={14} /> System Configuration
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Account & Preference Settings
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Manage your personal profile, credentials, system theme, and alert notifications.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* User Profile & Password */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User size={18} className="text-primary-400" />
          Personal Account Information
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                New Password <span className="text-slate-500 font-normal">(Leave blank to keep unchanged)</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Assigned System Role</label>
              <input
                type="text"
                value={user?.role?.toUpperCase().replace('_', ' ') || 'STAFF'}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 cursor-not-allowed font-semibold uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Interface Theme & Appearance */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Moon size={18} className="text-purple-400" />
          Appearance & Theme Mode
        </h2>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <div className="font-semibold text-xs text-white">System Visual Theme</div>
            <div className="text-[11px] text-slate-400">Switch between sleek dark mode and high-contrast light mode</div>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Moon size={14} className="text-purple-400" /> Dark Theme Enabled
              </>
            ) : (
              <>
                <Sun size={14} className="text-amber-400" /> Light Theme Enabled
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications Preferences */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Bell size={18} className="text-amber-400" />
          Real-time Alerts & Notifications
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="font-semibold text-xs text-white">Low Stock & Out of Stock Alerts</div>
              <div className="text-[11px] text-slate-400">Notify when SKU falls below defined reorder thresholds</div>
            </div>
            <input
              type="checkbox"
              checked={lowStockAlerts}
              onChange={(e) => setLowStockAlerts(e.target.checked)}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-primary-600 focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="font-semibold text-xs text-white">Product Shelf-Life & Expiry Alerts</div>
              <div className="text-[11px] text-slate-400">Trigger warnings for items expiring within 7 days</div>
            </div>
            <input
              type="checkbox"
              checked={expiryAlerts}
              onChange={(e) => setExpiryAlerts(e.target.checked)}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-primary-600 focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="font-semibold text-xs text-white">Inter-Company & Branch Transfer Alerts</div>
              <div className="text-[11px] text-slate-400">Receive notifications on approval or rejection of stock transfer requests</div>
            </div>
            <input
              type="checkbox"
              checked={transferAlerts}
              onChange={(e) => setTransferAlerts(e.target.checked)}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-primary-600 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
