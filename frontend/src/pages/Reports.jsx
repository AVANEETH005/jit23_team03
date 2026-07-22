import React, { useState, useEffect } from 'react';
import { useAuth, API_URL } from '../context/AuthContext';
import { 
  FileBarChart2, 
  Download, 
  Printer, 
  Filter, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  GitPullRequest, 
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

const Reports = () => {
  const { getAuthHeaders, activeBranchId } = useAuth();
  const [reportType, setReportType] = useState('stock'); // 'stock', 'forecast', 'defect', 'transfer', 'expiry'
  const [reportData, setReportData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(activeBranchId || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_URL}/branches`, { headers: getAuthHeaders() });
      if (res.ok) setBranches(await res.json());
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (reportType === 'stock') endpoint = `${API_URL}/products?branchId=${selectedBranch}`;
      else if (reportType === 'forecast') endpoint = `${API_URL}/forecast?branchId=${selectedBranch}`;
      else if (reportType === 'defect') endpoint = `${API_URL}/defects?branchId=${selectedBranch}`;
      else if (reportType === 'transfer') endpoint = `${API_URL}/transfers`;
      else if (reportType === 'expiry') endpoint = `${API_URL}/products?branchId=${selectedBranch}`;

      const res = await fetch(endpoint, { headers: getAuthHeaders() });
      if (res.ok) {
        let data = await res.json();
        if (reportType === 'expiry') {
          data = Array.isArray(data) ? data.filter(p => p.expiryDate) : [];
        } else if (reportType === 'forecast') {
          if (data && data.reorderRecommendations && Array.isArray(data.reorderRecommendations)) {
            data = data.reorderRecommendations;
          } else if (Array.isArray(data)) {
            // ok
          } else {
            data = [];
          }
        }
        setReportData(Array.isArray(data) ? data : []);
      } else {
        setReportData([]);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const keys = Object.keys(reportData[0]).filter(k => typeof reportData[0][k] !== 'object');
    const header = keys.join(',');
    const rows = reportData.map(row => keys.map(k => `"${row[k] || ''}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartStock_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-primary-400 font-semibold text-xs uppercase tracking-widest">
            <FileBarChart2 size={14} /> Analytics & Compliance
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Reports & Export Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Generate printable audit logs, inventory valuations, demand forecast reports, and transfer receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={printReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Printer size={16} />
            Print Report
          </button>
          
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Selector & Branch Filter */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { id: 'stock', name: 'Stock Valuation', icon: Boxes, color: 'text-blue-400' },
          { id: 'forecast', name: 'Demand Forecast', icon: TrendingUp, color: 'text-purple-400' },
          { id: 'defect', name: 'Defect Analysis', icon: AlertTriangle, color: 'text-rose-400' },
          { id: 'transfer', name: 'Transfer Audit', icon: GitPullRequest, color: 'text-amber-400' },
          { id: 'expiry', name: 'Expiry Schedule', icon: Clock, color: 'text-emerald-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                reportType === tab.id 
                  ? 'bg-slate-900 border-primary-500/50 shadow-lg shadow-primary-500/10' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon size={20} className={tab.color} />
                {reportType === tab.id && <span className="h-2 w-2 rounded-full bg-primary-400 animate-ping" />}
              </div>
              <div className="mt-3">
                <div className="font-semibold text-xs text-white">{tab.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Generate {tab.id} summary</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Branch Selector Filter */}
      <div className="flex items-center gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <Filter size={16} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-300">Filter Branch Context:</span>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-primary-500"
        >
          <option value="all">All Branches & Warehouses</option>
          {branches.map(b => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Report Table View */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-bold text-base text-white capitalize">{reportType} Intelligence Report</h2>
            <p className="text-xs text-slate-400">Total Records Generated: {reportData.length}</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Report Date: {new Date().toLocaleDateString()}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse">Loading report dataset...</div>
        ) : reportData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No records available for this report filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {reportType === 'stock' && (
                    <>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Unit Price</th>
                      <th className="py-3 px-4">Total Value</th>
                    </>
                  )}
                  {reportType === 'forecast' && (
                    <>
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-4">Branch</th>
                      <th className="py-3 px-4 text-center">Current Stock</th>
                      <th className="py-3 px-4 text-center">Predicted Demand</th>
                      <th className="py-3 px-4 text-center">AI Recommended Reorder</th>
                      <th className="py-3 px-4">Priority & Timeline</th>
                    </>
                  )}
                  {reportType === 'defect' && (
                    <>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Defect Reason</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reported By</th>
                    </>
                  )}
                  {reportType === 'transfer' && (
                    <>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Requested By</th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}
                  {reportType === 'expiry' && (
                    <>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Quantity</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {reportData.map((item, idx) => (
                  <tr key={item._id || item.productId || idx} className="hover:bg-slate-800/30">
                    {reportType === 'stock' && (
                      <>
                        <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{item.sku}</td>
                        <td className="py-3 px-4 text-slate-300">{item.category}</td>
                        <td className="py-3 px-4 font-bold text-white">{item.quantity}</td>
                        <td className="py-3 px-4 text-slate-300">₹{item.price ? item.price.toLocaleString('en-IN') : 0}</td>
                        <td className="py-3 px-4 font-bold text-emerald-400">₹{((item.quantity || 0) * (item.price || 0)).toLocaleString('en-IN')}</td>
                      </>
                    )}
                    {reportType === 'forecast' && (
                      <>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex flex-col">
                            <span>{item.name || 'Product'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{item.branchName || 'Warehouse'}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-200">{item.currentStock ?? 0} units</td>
                        <td className="py-3 px-4 text-center font-bold text-purple-400">{item.predictedDemand ?? 0} units</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">+{item.recommendedReorderQty ?? 0} units</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            item.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {item.priority || 'Medium'} • {item.timeline || 'Within 14 Days'}
                          </span>
                        </td>
                      </>
                    )}
                    {reportType === 'defect' && (
                      <>
                        <td className="py-3 px-4 font-semibold text-white">{item.productName || item.productId}</td>
                        <td className="py-3 px-4 font-semibold text-rose-400">{item.reason}</td>
                        <td className="py-3 px-4 font-bold text-white">{item.quantity}</td>
                        <td className="py-3 px-4 capitalize text-slate-300">{item.status}</td>
                        <td className="py-3 px-4 text-slate-400">{item.reportedBy}</td>
                      </>
                    )}
                    {reportType === 'transfer' && (
                      <>
                        <td className="py-3 px-4 capitalize text-slate-300">{item.type}</td>
                        <td className="py-3 px-4 font-semibold text-white">{item.productName}</td>
                        <td className="py-3 px-4 font-bold text-white">{item.quantity}</td>
                        <td className="py-3 px-4 text-slate-400">{item.requestedBy}</td>
                        <td className="py-3 px-4 capitalize font-medium text-amber-400">{item.status}</td>
                      </>
                    )}
                    {reportType === 'expiry' && (
                      <>
                        <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{item.sku}</td>
                        <td className="py-3 px-4 text-rose-400 font-bold">{new Date(item.expiryDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-white">{item.quantity}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
