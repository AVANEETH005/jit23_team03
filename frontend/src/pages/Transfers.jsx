import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  GitPullRequest, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRightLeft, 
  Plus, 
  Search, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

const Transfers = () => {
  const { user, getAuthHeaders, activeBranchId } = useAuth();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'marketplace', 'smart_logic'
  const [transfers, setTransfers] = useState([]);
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [transferNotes, setTransferNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Smart Transfer Calculator modal state
  const [smartProductSearch, setSmartProductSearch] = useState('');
  const [smartResult, setSmartResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeBranchId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, markRes, branchRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/transfers`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/transfers/marketplace`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/branches`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/products?branchId=${activeBranchId}`, { headers: getAuthHeaders() })
      ]);

      if (transRes.ok) setTransfers(await transRes.json());
      if (markRes.ok) setMarketplaceItems(await markRes.json());
      if (branchRes.ok) setBranches(await branchRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
      console.error('Failed to load transfers data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !targetBranch || transferQty <= 0) return;
    setSubmitting(true);

    try {
      const prodObj = products.find(p => p._id === selectedProduct);
      const res = await fetch(`${API_URL}/transfers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: 'internal_transfer',
          sourceBranchId: user.branchId,
          targetBranchId: targetBranch,
          productId: selectedProduct,
          productName: prodObj ? prodObj.name : 'Product',
          productSku: prodObj ? prodObj.sku : 'SKU',
          quantity: Number(transferQty),
          notes: transferNotes
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setSelectedProduct('');
        setTargetBranch('');
        setTransferQty(1);
        setTransferNotes('');
        fetchData();
      }
    } catch (err) {
      console.error('Create transfer failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarketplaceRequest = async (item) => {
    if (!user.branchId) return;
    try {
      const res = await fetch(`${API_URL}/transfers/marketplace/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: item._id,
          targetBranchId: user.branchId,
          quantity: 5,
          notes: `Inter-company exchange request for ${item.name}`
        })
      });
      if (res.ok) {
        alert(`Exchange request sent to ${item.companyName || 'partner company'}!`);
        fetchData();
      }
    } catch (err) {
      console.error('Marketplace request failed:', err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/transfers/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Update status failed:', err);
    }
  };

  const calculateSmartPriority = (productName) => {
    if (!productName) return null;
    const term = productName.toLowerCase();
    
    // Simulate priority check across branches & partner companies
    const localMatch = products.find(p => p.name.toLowerCase().includes(term) && p.quantity > 0);
    if (localMatch) {
      return {
        priority: 1,
        source: 'Current Branch Stock',
        detail: `Available in local stock (${localMatch.quantity} units remaining in ${localMatch.branchName || 'Current Branch'}).`,
        action: 'Fulfill Locally',
        color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      };
    }

    const sameCompanyBranches = branches.filter(b => b._id !== user.branchId);
    const otherBranch = sameCompanyBranches.find(b => !b.isWarehouse);
    if (otherBranch) {
      return {
        priority: 2,
        source: `Branch Transfer (${otherBranch.name})`,
        detail: `Item unavailable locally. Found available stock in sister branch "${otherBranch.name}".`,
        action: 'Initiate Internal Transfer',
        color: 'border-blue-500/30 bg-blue-500/10 text-blue-400'
      };
    }

    const warehouseBranch = branches.find(b => b.isWarehouse);
    if (warehouseBranch) {
      return {
        priority: 3,
        source: `Main Warehouse (${warehouseBranch.name})`,
        detail: `Stock reserved in Central Hub. Automated stock pull requested.`,
        action: 'Request Warehouse Dispatch',
        color: 'border-purple-500/30 bg-purple-500/10 text-purple-400'
      };
    }

    const partnerMatch = marketplaceItems.find(m => m.name.toLowerCase().includes(term));
    if (partnerMatch) {
      return {
        priority: 4,
        source: `Partner Company Exchange (${partnerMatch.companyName || 'Apex Retail Group'})`,
        detail: `Excess stock available on Shared Marketplace. Partner willing to exchange.`,
        action: 'Submit Inter-Company Exchange',
        color: 'border-amber-500/30 bg-amber-500/10 text-amber-400'
      };
    }

    return {
      priority: 5,
      source: 'Direct Supplier Purchase',
      detail: 'No stock available across internal branches or partner companies. Recommended action: Place purchase order with official supplier.',
      action: 'Create Purchase Order',
      color: 'border-slate-700 bg-slate-800 text-slate-300'
    };
  };

  const filteredTransfers = transfers.filter(t => 
    t.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.productSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.requestedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-primary-400 font-semibold text-xs uppercase tracking-widest">
            <GitPullRequest size={14} /> Smart Stock Intelligence
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Transfers & Goods Exchange Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Seamlessly manage internal stock transfers, branch requests, and partner company goods exchange.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('smart_logic')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Sparkles size={16} />
            Smart Priority Routing
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium text-xs shadow-lg shadow-primary-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            New Transfer Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'requests' 
              ? 'border-primary-500 text-primary-400 font-semibold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitPullRequest size={16} />
          Transfer Requests ({transfers.length})
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'marketplace' 
              ? 'border-primary-500 text-primary-400 font-semibold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag size={16} />
          Inter-Company Shared Marketplace ({marketplaceItems.length})
        </button>

        <button
          onClick={() => setActiveTab('smart_logic')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'smart_logic' 
              ? 'border-primary-500 text-primary-400 font-semibold' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles size={16} />
          Smart Priority Routing Engine
        </button>
      </div>

      {/* Search and Filters */}
      {activeTab !== 'smart_logic' && (
        <div className="flex items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by product, SKU, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* Tab Content 1: Transfer Requests */}
      {activeTab === 'requests' && (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
          {filteredTransfers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <GitPullRequest size={36} className="mx-auto text-slate-600" />
              <p className="text-sm font-medium">No transfer requests found.</p>
              <p className="text-xs text-slate-500">Initiate a transfer request or partner exchange to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Product / SKU</th>
                    <th className="py-3.5 px-4">Qty</th>
                    <th className="py-3.5 px-4">From / To</th>
                    <th className="py-3.5 px-4">Requested By</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredTransfers.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase ${
                          item.type === 'company_exchange' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {item.type === 'company_exchange' ? <ShoppingBag size={12} /> : <ArrowRightLeft size={12} />}
                          {item.type === 'company_exchange' ? 'Partner Exchange' : 'Internal Transfer'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">{item.productSku}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{item.quantity} units</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-400 truncate max-w-[120px]">{item.sourceBranchName || 'Source Branch'}</span>
                          <ArrowRight size={12} className="text-slate-500 shrink-0" />
                          <span className="text-primary-400 font-medium truncate max-w-[120px]">{item.targetBranchName || 'Target Branch'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{item.requestedBy || 'System'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${
                          item.status === 'approved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : item.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}>
                          {item.status === 'approved' && <CheckCircle2 size={12} />}
                          {item.status === 'rejected' && <XCircle size={12} />}
                          {item.status === 'pending' && <Clock size={12} />}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status === 'pending' && (user.role === 'admin' || user.role === 'manager') ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStatus(item._id, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item._id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No action required</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Inter-Company Shared Stock Marketplace */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Inter-Company Goods Exchange Network:</span> Partner companies publish excess shareable inventory here. Request items to fill urgent stock shortages without waiting for long supplier leads.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaceItems.map((item) => (
              <div key={item._id} className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition-all shadow-md">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category || 'General'}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Excess Shareable
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white">{item.name}</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.sku}</div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available Stock:</span>
                      <span className="font-bold text-white">{item.quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Exchange Price:</span>
                      <span className="font-semibold text-primary-400">₹{item.price ? item.price.toLocaleString('en-IN') : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Company Owner:</span>
                      <span className="font-medium text-slate-200">{item.companyName || 'Apex Retail Group'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleMarketplaceRequest(item)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  Request Stock Exchange
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Smart Priority Routing Engine */}
      {activeTab === 'smart_logic' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-6">
          <div className="max-w-xl space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-purple-400" />
              Automated Stock Transfer Priority Engine
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a product is requested or depleted in a branch, the Smart Stock Engine evaluates availability across 5 sequential tiers to minimize shipping cost and lead time:
            </p>
          </div>

          {/* Hierarchy Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { num: 1, title: 'Current Branch', desc: 'Fulfill immediately from local store shelf', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
              { num: 2, title: 'Sister Branch', desc: 'Pull stock from nearby company branch', color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
              { num: 3, title: 'Main Warehouse', desc: 'Dispatch bulk stock from central depot', color: 'border-purple-500/30 bg-purple-500/5 text-purple-400' },
              { num: 4, title: 'Partner Exchange', desc: 'Inter-company excess stock marketplace', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
              { num: 5, title: 'Supplier Order', desc: 'Place new purchase order with manufacturer', color: 'border-slate-700 bg-slate-800/40 text-slate-400' },
            ].map(item => (
              <div key={item.num} className={`p-4 rounded-xl border ${item.color} flex flex-col justify-between`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Priority {item.num}</span>
                  <span className="h-5 w-5 rounded-full bg-slate-900/60 flex items-center justify-center font-bold text-xs">{item.num}</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Routing Test */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HelpCircle size={16} className="text-primary-400" />
              Test Priority Routing Algorithm
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter product name (e.g. MacBook Pro 16, Paracetamol, Samsung S24)..."
                value={smartProductSearch}
                onChange={(e) => {
                  setSmartProductSearch(e.target.value);
                  setSmartResult(calculateSmartPriority(e.target.value));
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            {smartResult && (
              <div className={`p-4 rounded-xl border ${smartResult.color} space-y-2 animate-fade-in`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">Priority Level {smartResult.priority} Optimal Source:</span>
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-slate-900/80">{smartResult.action}</span>
                </div>
                <div className="font-semibold text-sm text-white">{smartResult.source}</div>
                <p className="text-xs text-slate-300">{smartResult.detail}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Transfer */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-white">Create Transfer Request</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary-500"
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (SKU: {p.sku}) - Stock: {p.quantity}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Destination Branch</label>
                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary-500"
                  required
                >
                  <option value="">-- Choose Branch --</option>
                  {branches.filter(b => b._id !== user.branchId).map(b => (
                    <option key={b._id} value={b._id}>{b.name} {b.isWarehouse ? '(Central Warehouse)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Quantity to Transfer</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Transfer Purpose / Notes</label>
                <textarea
                  rows="3"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Fulfill urgent stock shortage in Downtown branch..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary-500 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium text-xs shadow-lg shadow-primary-500/20 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfers;
