import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import WebcamCapture from '../components/WebcamCapture';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeftRight, 
  X, 
  Info,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  Camera,
  Zap
} from 'lucide-react';

const Products = () => {
  const { user, activeBranchId, token, getAuthHeaders } = useAuth();
  const { triggerToast } = useNotifications();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  
  // Search and Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');

  // Modals
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentProduct, setCurrentProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    quantity: 0,
    price: 0,
    supplier: '',
    expiryDate: '',
    branchId: '',
    lowStockThreshold: 10,
    excessThreshold: 100,
    isExcessShareable: false
  });

  // Sourcing Recommendation Modal
  const [isSourcingModalOpen, setIsSourcingModalOpen] = useState(false);
  const [sourcingData, setSourcingData] = useState(null);
  const [sourcingProduct, setSourcingProduct] = useState(null);
  const [sourcingLoading, setSourcingLoading] = useState(false);
  const [transferQty, setTransferQty] = useState(1);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Broad categories for all item types
  const categoriesList = [
    'Electronics', 
    'Pharmaceuticals', 
    'Groceries & FMCG', 
    'Apparel & Clothing', 
    'Industrial & Hardware', 
    'Office Supplies', 
    'Home & Kitchen', 
    'Beverages & Foods',
    'Automobile Parts'
  ];

  // Load products and branches
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Fetch branches
      const branchesRes = await fetch('http://localhost:5000/api/branches', { headers });
      let branchList = [];
      if (branchesRes.ok) {
        const branchData = await branchesRes.json();
        setBranches(branchData);
        branchList = branchData;
      }

      // Fetch products
      let url = `http://localhost:5000/api/products?search=${search}&category=${category}&status=${status}`;
      if (user.role === 'admin' || user.role === 'manager') {
        if (selectedBranchFilter !== 'all') {
          url += `&branch=${selectedBranchFilter}`;
        } else if (activeBranchId !== 'all') {
          url += `&branch=${activeBranchId}`;
        }
      }
      
      const productsRes = await fetch(url, { headers });
      if (productsRes.ok) {
        const prodData = await productsRes.json();
        setProducts(prodData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, category, status, selectedBranchFilter, activeBranchId]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      name: '',
      sku: '',
      category: 'Electronics',
      quantity: 10,
      price: 1499,
      supplier: '',
      expiryDate: '',
      branchId: user.branchId || (branches.length > 0 ? branches[0]._id : ''),
      lowStockThreshold: 10,
      excessThreshold: 100,
      isExcessShareable: false
    });
    setIsCrudModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setModalMode('edit');
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
      supplier: product.supplier || '',
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      branchId: product.branchId,
      lowStockThreshold: product.lowStockThreshold || 10,
      excessThreshold: product.excessThreshold || 100,
      isExcessShareable: product.isExcessShareable || false
    });
    setIsCrudModalOpen(true);
  };

  const handleCrudSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = modalMode === 'create' 
      ? 'http://localhost:5000/api/products' 
      : `http://localhost:5000/api/products/${currentProduct._id}`;

    try {
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        triggerToast(
          'success', 
          `Product ${modalMode === 'create' ? 'Created' : 'Updated'}`, 
          `"${formData.name}" has been saved.`
        );
        setIsCrudModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Error occurred');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        triggerToast('success', 'Product Deleted', `"${name}" removed from database.`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Sourcing Recommendation Modal
  const handleOpenSourcing = async (product) => {
    setSourcingProduct(product);
    setIsSourcingModalOpen(true);
    setSourcingLoading(true);
    setTransferQty(1);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/transfers/sourcing-recommendation/${product._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSourcingData(data.recommendations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSourcingLoading(false);
    }
  };

  // Execute internal / partner transfer request
  const handleExecuteTransfer = async (option) => {
    if (!sourcingProduct || !transferQty) return;
    setIsSubmittingTransfer(true);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceBranchId: option.branchId,
          targetBranchId: sourcingProduct.branchId,
          productId: option.productId,
          quantity: Number(transferQty),
          notes: `Auto Sourced: Sourcing recommendation transfer for SKU ${sourcingProduct.sku}`
        })
      });

      if (res.ok) {
        triggerToast('transfer_request', 'Transfer Request Dispatched', 'Awaiting source branch approval.');
        setIsSourcingModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to submit transfer order');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Status badges formatter
  const renderStatus = (p) => {
    const today = new Date();
    const isLow = p.quantity > 0 && p.quantity <= p.lowStockThreshold;

    if (p.quantity === 0) {
      return <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Out of Stock</span>;
    }
    if (isLow) {
      return <span className="bg-orange-500/10 text-orange-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Low Stock</span>;
    }

    if (p.expiryDate) {
      const diff = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
      if (diff < 0) {
        return <span className="bg-red-700/15 text-red-650 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Expired</span>;
      }
      if (diff <= 7) {
        return <span className="bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Expiring Soon</span>;
      }
    }

    return <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Healthy</span>;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans dark:text-white">Product Inventory Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage all warehouse items (Electronics, Groceries, Medical, Apparel, Hardware) with manual & webcam intake.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Quick Webcam Auto-Add Item button */}
          <button
            onClick={() => setIsWebcamModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/10"
          >
            <Camera size={15} />
            <Zap size={13} className="text-amber-300" />
            Webcam Auto-Add Item
          </button>

          {user.role !== 'staff' && (
            <button
              onClick={handleOpenCreate}
              className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary-900/10"
            >
              <Plus size={16} />
              Manual Item Entry
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU or Name..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-primary-500 text-slate-800 dark:text-slate-200 placeholder-slate-450"
          />
        </div>

        {/* Filters */}
        <div className="w-full flex flex-wrap lg:justify-end gap-3.5">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px] lg:flex-none">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2.5 text-slate-750 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px] lg:flex-none">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2.5 text-slate-750 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="healthy">Healthy Stock</option>
              <option value="low_stock">Low Stock Warnings</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="expiring_soon">Expiring Soon (7d)</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {(user.role === 'admin' || user.role === 'manager') && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[140px] lg:flex-none">
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2.5 text-slate-750 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Branches</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Products Table View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-premium">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin text-primary-500 mx-auto mb-2" size={24} />
            <span className="text-xs text-slate-500">Querying product records...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center text-slate-400 dark:text-slate-500 text-xs">
            No products found matching filters. Add a new item manually or via webcam scan to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-5">SKU</th>
                  <th className="py-4 px-5">Branch Assignment</th>
                  <th className="py-4 px-5 text-right">Available Stock</th>
                  <th className="py-4 px-5 text-right">Unit Price (INR)</th>
                  <th className="py-4 px-5">QA Expiry Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                {products.map((p) => {
                  const isLow = p.quantity <= p.lowStockThreshold;
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                      
                      {/* Name / Category */}
                      <td className="py-3.5 px-6 font-semibold text-slate-850 dark:text-white">
                        <div className="flex flex-col gap-0.5">
                          <span>{p.name}</span>
                          <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">{p.category}</span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-5 font-mono text-[10px] uppercase">{p.sku}</td>

                      {/* Branch Name */}
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 font-medium">{p.branchName}</td>

                      {/* Qty */}
                      <td className="py-3.5 px-5 text-right font-bold">
                        <span className={p.quantity === 0 ? 'text-red-500' : (isLow ? 'text-orange-500' : 'text-slate-800 dark:text-slate-200')}>
                          {p.quantity.toLocaleString()}
                        </span>
                      </td>

                      {/* Price in INR ₹ */}
                      <td className="py-3.5 px-5 text-right font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        ₹{p.price ? p.price.toLocaleString('en-IN') : '0'}
                      </td>

                      {/* Expiry / Status */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col items-start gap-1">
                          {renderStatus(p)}
                          {p.expiryDate && (
                            <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                              <Calendar size={10} />
                              {new Date(p.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Smart sourcing triggers if stock is low or out */}
                          {isLow && (
                            <button
                              onClick={() => handleOpenSourcing(p)}
                              className="h-8 px-2.5 rounded-lg border border-primary-500/20 text-primary-500 dark:text-primary-400 bg-primary-500/5 hover:bg-primary-500/10 flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase cursor-pointer"
                              title="Resolve stock shortfall"
                            >
                              <Sparkles size={11} className="animate-pulse" />
                              Sourcing Options
                            </button>
                          )}

                          {user.role !== 'staff' && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-250/20 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                              title="Edit item parameters"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}

                          {(user.role === 'admin' || user.role === 'manager') && (
                            <button
                              onClick={() => handleDelete(p._id, p.name)}
                              className="h-8 w-8 rounded-lg hover:bg-red-500/10 border border-slate-250/20 text-slate-400 hover:text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                              title="Delete product"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WEBCAM AUTO-ADD ITEM MODAL */}
      {isWebcamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                <Camera size={16} />
                <span>Webcam Auto-Pass Stock Intake Scanner</span>
              </div>
              <button 
                onClick={() => setIsWebcamModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <WebcamCapture mode="stock_entry" onProductAdded={() => { fetchData(); }} />
          </div>
        </div>
      )}

      {/* MANUAL CRUD MODAL CONTAINER */}
      {isCrudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3.5 mb-4">
              <h3 className="font-bold text-sm font-sans uppercase tracking-wider">{modalMode === 'create' ? 'Create New Item Manually' : 'Edit Item Parameters'}</h3>
              <button 
                onClick={() => setIsCrudModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCrudSubmit} className="flex flex-col gap-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parboiled Rice 10kg, Cotton Shirt, Power Drill"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RICE-10K, SHIRT-L, HW-DRILL"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                    required
                  >
                    {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Consumer, Apple India, Bayer"
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">Price (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="1250.00"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">Branch Assignment</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                    disabled={user.role === 'branch_user' || user.role === 'staff'}
                  >
                    {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-slate-500">Expiry Date (Perishables)</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 outline-none text-slate-850 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Excess details for exchange */}
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-750 flex flex-col gap-3 mt-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Excess Stock Sharing (Partner Exchange)</span>
                    <span className="text-[10px] text-slate-400">Flag this product as excess to make it available for partner company purchases in the marketplace exchange.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isExcessShareable}
                    onChange={(e) => setFormData(prev => ({ ...prev, isExcessShareable: e.target.checked }))}
                    className="h-4.5 w-4.5 rounded text-primary-650 cursor-pointer outline-none"
                  />
                </div>
                
                {formData.isExcessShareable && (
                  <div className="flex flex-col gap-1 animate-fade-in">
                    <label className="font-semibold text-slate-500">Excess Stock Limit Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.excessThreshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, excessThreshold: e.target.value }))}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCrudModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-755 dark:text-slate-300 font-semibold rounded-xl py-3 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl py-3 cursor-pointer text-center"
                >
                  {modalMode === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SMART SOURCING RECOMMENDATIONS MODAL */}
      {isSourcingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-3 mb-4">
              <div className="flex items-center gap-1 text-primary-500 font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} className="animate-pulse" />
                <span>Smart Sourcing Recommendations</span>
              </div>
              <button 
                onClick={() => setIsSourcingModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {sourcingProduct && (
              <div className="mb-4">
                <h4 className="font-bold text-sm text-slate-850 dark:text-white">{sourcingProduct.name}</h4>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                  SKU: {sourcingProduct.sku} • Current Branch Stock: <span className="font-bold text-red-500">{sourcingProduct.quantity} units</span> (Threshold: {sourcingProduct.lowStockThreshold})
                </p>
              </div>
            )}

            {sourcingLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="animate-spin text-primary-500 mx-auto mb-2" size={24} />
                <span className="text-xs text-slate-500">Querying sourcing options...</span>
              </div>
            ) : !sourcingData || sourcingData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No sourcing paths found in company networks.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                
                {/* Quantity Input for transfer */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-350">Enter Sourcing Quantity Needed:</span>
                  <input
                    type="number"
                    min="1"
                    value={transferQty}
                    onChange={(e) => setTransferQty(e.target.value)}
                    className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl p-2 outline-none text-center font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {sourcingData.map((option) => (
                    <div 
                      key={option.priority}
                      className="p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[10px] px-1.5 py-0.25 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                            P{option.priority}
                          </span>
                          <span className="font-semibold text-slate-850 dark:text-white">{option.source}</span>
                        </div>
                        <span className="text-[10px] text-slate-450 mt-0.5">Location: {option.detail}</span>
                        {option.quantity !== undefined && (
                          <span className="text-[10px] text-slate-400 font-sans">
                            Available Stock: <span className={`font-bold ${option.quantity > 0 ? 'text-green-500' : 'text-slate-400'}`}>{option.quantity} units</span>
                          </span>
                        )}
                      </div>

                      {option.actionable ? (
                        option.type === 'supplier' ? (
                          <a
                            href={`mailto:supplier@example.com?subject=Purchase%20Order:%20${sourcingProduct.sku}&body=Request%20to%20order%2520${transferQty}%20units%20of%20${sourcingProduct.name}`}
                            className="bg-slate-900 dark:bg-slate-850 text-white font-semibold text-[10px] uppercase px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                          >
                            Email PO
                          </a>
                        ) : (
                          <button
                            onClick={() => handleExecuteTransfer(option)}
                            disabled={isSubmittingTransfer || transferQty > option.quantity}
                            className="bg-primary-600 hover:bg-primary-500 text-white font-semibold text-[10px] uppercase px-3 py-2 rounded-xl cursor-pointer disabled:opacity-50"
                          >
                            Request Sourcing
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 italic">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-800/80 flex gap-2 text-[10px] text-slate-400 leading-normal">
                  <Info size={14} className="text-primary-500 shrink-0 mt-0.5" />
                  <p>
                    Sourcing calculations query company hubs first (priority 2-3), partner sharing marketplaces next (priority 4), and trigger external vendor purchases as a final safety route.
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
