import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  AlertOctagon, 
  Clock, 
  Tag, 
  CheckCircle2, 
  Trash2, 
  Bell, 
  Search, 
  TrendingDown,
  Percent,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const ExpiryAnalytics = () => {
  const { getAuthHeaders, activeBranchId } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'expiring_7', 'expired'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [activeBranchId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products?branchId=${activeBranchId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        // Filter products that have expiry dates
        setProducts(data.filter(p => p.expiryDate));
      }
    } catch (err) {
      console.error('Failed to fetch expiry products:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const diffTime = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const expiredProducts = products.filter(p => getDaysUntilExpiry(p.expiryDate) <= 0);
  const expiring7Days = products.filter(p => {
    const days = getDaysUntilExpiry(p.expiryDate);
    return days > 0 && days <= 7;
  });
  const expiring30Days = products.filter(p => {
    const days = getDaysUntilExpiry(p.expiryDate);
    return days > 7 && days <= 30;
  });

  const getSuggestedAction = (days) => {
    if (days <= 0) {
      return {
        status: 'Expired',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        recommendation: 'Log as Defect & Dispose',
        discount: 'Disposal Required',
        actionColor: 'bg-rose-600 hover:bg-rose-500 text-white'
      };
    } else if (days <= 7) {
      return {
        status: 'Critical (Expiring < 7 Days)',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
        recommendation: 'Apply Urgent 50% Priority Sell-First Markdown',
        discount: '50% OFF Clearance',
        actionColor: 'bg-amber-600 hover:bg-amber-500 text-white'
      };
    } else if (days <= 30) {
      return {
        status: 'Warning (Expiring < 30 Days)',
        badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        recommendation: 'Apply 20% Promotional Discount',
        discount: '20% OFF Promo',
        actionColor: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
      };
    } else {
      return {
        status: 'Safe Stock',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        recommendation: 'Regular Retail Rotation',
        discount: 'Full Price',
        actionColor: 'bg-slate-800 text-slate-500 cursor-not-allowed'
      };
    }
  };

  const filteredList = products.filter(p => {
    const days = getDaysUntilExpiry(p.expiryDate);
    if (filter === 'expiring_7') return days > 0 && days <= 7;
    if (filter === 'expired') return days <= 0;
    return true;
  }).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-widest">
            <AlertOctagon size={14} /> Expiry Intelligence Engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Expiry Analytics & Priority Sell-First
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Track shelf-life degradation, prevent inventory write-offs, and automate clearance pricing.
          </p>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium">Expired Products</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{expiredProducts.length}</div>
            <span className="text-[10px] text-slate-500">Requires immediate write-off</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertOctagon size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium">Expiring in 7 Days</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{expiring7Days.length}</div>
            <span className="text-[10px] text-slate-500">Urgent clearance priority</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium">Expiring in 30 Days</span>
            <div className="text-2xl font-bold text-yellow-400 mt-1">{expiring30Days.length}</div>
            <span className="text-[10px] text-slate-500">Promotional discount phase</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            <Calendar size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-medium">Total Tracked Expiries</span>
            <div className="text-2xl font-bold text-white mt-1">{products.length}</div>
            <span className="text-[10px] text-slate-500">Perishable SKUs monitored</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
            <Tag size={20} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all' 
                ? 'bg-primary-600 text-white shadow-md' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Perishables ({products.length})
          </button>
          <button
            onClick={() => setFilter('expiring_7')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              filter === 'expiring_7' 
                ? 'bg-amber-600 text-white shadow-md' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Expiring &lt; 7 Days ({expiring7Days.length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              filter === 'expired' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Expired Items ({expiredProducts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Expiry Table */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <CheckCircle2 size={36} className="mx-auto text-slate-600" />
            <p className="text-sm font-medium">No products match current expiry filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product Name / SKU</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Days Left</th>
                  <th className="py-3.5 px-4">Stock Qty</th>
                  <th className="py-3.5 px-4">Status & Recommendation</th>
                  <th className="py-3.5 px-4 text-right">Priority Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredList.map((product) => {
                  const daysLeft = getDaysUntilExpiry(product.expiryDate);
                  const action = getSuggestedAction(daysLeft);

                  return (
                    <tr key={product._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{product.name}</div>
                        <div className="text-[10px] text-slate-400">{product.sku} ({product.category})</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {new Date(product.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${daysLeft <= 0 ? 'text-rose-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {daysLeft <= 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{product.quantity} units</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${action.badge}`}>
                            {action.status}
                          </span>
                          <div className="text-[11px] text-slate-400">{action.recommendation}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => alert(`Applied Priority Action: ${action.discount} for ${product.name}`)}
                          className={`px-3 py-1.5 rounded-xl font-medium text-[11px] transition-colors cursor-pointer ${action.actionColor}`}
                        >
                          {action.discount}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiryAnalytics;
