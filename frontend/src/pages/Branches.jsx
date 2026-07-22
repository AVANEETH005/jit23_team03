import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Building2, 
  MapPin, 
  Plus, 
  X, 
  Loader2, 
  Boxes, 
  DollarSign, 
  AlertTriangle,
  Warehouse
} from 'lucide-react';

const Branches = () => {
  const { user, token } = useAuth();
  const { triggerToast } = useNotifications();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected branch stats
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [branchStats, setBranchStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    isWarehouse: false
  });

  const fetchBranches = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch('http://localhost:5000/api/branches', { headers });
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
        if (data.length > 0 && !selectedBranchId) {
          setSelectedBranchId(data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedStats = async () => {
    if (!selectedBranchId) return;
    setStatsLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`http://localhost:5000/api/branches/stats?branchId=${selectedBranchId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBranchStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchSelectedStats();
  }, [selectedBranchId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5000/api/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        triggerToast('success', 'Branch Added', `"${formData.name}" initialized successfully.`);
        setIsModalOpen(false);
        setFormData({ name: '', address: '', isWarehouse: false });
        fetchBranches();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to add branch');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans dark:text-white">Multi-Branch Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Spin up new outlets, monitor physical addresses, and audit localized branch quantities.</p>
        </div>
        {user.role !== 'staff' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary-900/10 self-start md:self-auto"
          >
            <Plus size={16} />
            Add New Hub
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Branches list cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm font-sans">Active Hub Networks</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Click a card to inspect inventory volumes at that specific warehouse or branch</span>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="animate-spin text-primary-500 mx-auto mb-2" size={20} />
              <span className="text-xs text-slate-500">Querying branch hubs...</span>
            </div>
          ) : branches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No branch hubs configured.
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {branches.map(b => (
                <div
                  key={b._id}
                  onClick={() => setSelectedBranchId(b._id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between hover-glow ${
                    selectedBranchId === b._id 
                      ? 'bg-slate-900 border-slate-800 text-white shadow-xl dark:bg-slate-900 dark:border-primary-500/20' 
                      : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${selectedBranchId === b._id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {b.isWarehouse ? <Warehouse size={18} /> : <Building2 size={18} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate">{b.name}</span>
                      <span className={`text-[10px] flex items-center gap-1 mt-0.5 truncate ${selectedBranchId === b._id ? 'text-slate-400' : 'text-slate-500'}`}>
                        <MapPin size={10} className="shrink-0" />
                        {b.address || 'No address logged'}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    b.isWarehouse 
                      ? (selectedBranchId === b._id ? 'bg-primary-600/30 text-primary-300' : 'bg-primary-500/10 text-primary-500')
                      : (selectedBranchId === b._id ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')
                  }`}>
                    {b.isWarehouse ? 'HQ WH' : 'Hub'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Localized Inventory statistics dashboard */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium">
          <div className="flex flex-col mb-4">
            <span className="font-semibold text-slate-850 dark:text-white text-sm font-sans">Hub Analytics Snapshot</span>
            <span className="text-[10px] text-slate-400">Inventory counts, valuations, and warnings matching the selected hub</span>
          </div>

          {statsLoading || !branchStats ? (
            <div className="py-24 text-center">
              <Loader2 className="animate-spin text-primary-500 mx-auto mb-2" size={20} />
              <span className="text-xs text-slate-500">Retrieving stats...</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in text-xs">
              
              {/* Branch stats aggregates grid */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Total Value */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/20 flex items-center gap-3">
                  <div className="h-9 w-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <DollarSign size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Inventory Value</span>
                    <span className="font-extrabold text-slate-850 dark:text-white text-sm mt-0.5">
                      ${branchStats.totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Total Quantity */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/20 flex items-center gap-3">
                  <div className="h-9 w-9 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-500">
                    <Boxes size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Quantity</span>
                    <span className="font-extrabold text-slate-850 dark:text-white text-sm mt-0.5">
                      {branchStats.totalQuantity.toLocaleString()} units
                    </span>
                  </div>
                </div>

                {/* Low Stock count */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/20 flex items-center gap-3">
                  <div className="h-9 w-9 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Low Stock Warnings</span>
                    <span className="font-extrabold text-slate-850 dark:text-white text-sm mt-0.5">
                      {branchStats.lowStock} products
                    </span>
                  </div>
                </div>

                {/* Out of Stock count */}
                <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/20 flex items-center gap-3">
                  <div className="h-9 w-9 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Out of Stock</span>
                    <span className="font-extrabold text-slate-850 dark:text-white text-sm mt-0.5">
                      {branchStats.outOfStock} products
                    </span>
                  </div>
                </div>

              </div>

              {/* QA Quarantine / Defect items alerts */}
              <div className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-2">
                <span className="font-semibold text-slate-850 dark:text-white">Active Quarantine Quarantine Status</span>
                <p className="text-slate-500 dark:text-slate-400 leading-normal text-[11px]">
                  There are currently **{branchStats.defectiveItemsCount} defective items** flagged at this hub location. Ensure QA logs are verified in the Defect Center to process disposal steps.
                </p>
              </div>

              {/* Demand Forecasting predictions */}
              <div className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">Predicted Replacement Sourcing</span>
                  <span className="text-[10px] text-slate-400 leading-normal">
                    AI models estimate **{branchStats.forecastDemand} units** of stock replenishments will be required next month.
                  </span>
                </div>
                <span className="font-extrabold text-primary-400 text-base shrink-0 font-sans">
                  +{branchStats.forecastDemand}
                </span>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* CREATE BRANCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fade-in text-slate-850 dark:text-slate-100 flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider">Initialize Sibling Hub</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-500">Hub Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Branch C - Airport Plaza"
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-850 dark:text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-slate-500">Physical Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 10 Warehouse Loop Road"
                  className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-850 dark:text-slate-200"
                />
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800/80 flex items-center justify-between mt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Main Warehouse (HQ status)</span>
                  <span className="text-[10px] text-slate-450 leading-normal">
                    Check if this is a primary supply center warehouse rather than a small sales branch outlet.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isWarehouse}
                  onChange={(e) => setFormData(prev => ({ ...prev, isWarehouse: e.target.checked }))}
                  className="h-4.5 w-4.5 rounded text-primary-650 cursor-pointer outline-none shrink-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-755 dark:text-slate-300 font-semibold rounded-xl py-3 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl py-3 cursor-pointer text-center"
                >
                  Initialize Hub
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Branches;
