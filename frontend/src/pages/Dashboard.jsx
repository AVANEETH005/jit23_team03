import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  AlertOctagon, 
  Activity, 
  Building2, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';

const defaultStats = {
  totalValue: 0,
  totalQuantity: 0,
  totalProducts: 0,
  lowStock: 0,
  outOfStock: 0,
  defectiveItemsCount: 0,
  pendingTransfers: 0,
  forecastDemand: 0
};

const Dashboard = () => {
  const { activeBranchId, token } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [stats, setStats] = useState(defaultStats);
  const [forecastData, setForecastData] = useState([]);
  const [fastMoving, setFastMoving] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`http://localhost:5000/api/branches/stats?branchId=${activeBranchId}`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        console.warn('Stats request returned status:', statsRes.status);
      }

      // 2. Fetch Forecast Data
      const forecastRes = await fetch(`http://localhost:5000/api/forecast?branchId=${activeBranchId}`, { headers });
      if (forecastRes.ok) {
        const fData = await forecastRes.json();
        setForecastData(fData.trendData || []);
        setFastMoving(fData.fastMovingProducts || []);
      }

      // Refresh notifications panel
      refreshNotifications();

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setErrorMsg('Could not connect to backend server. Please make sure backend server is running on http://localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeBranchId]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <Activity size={24} className="text-primary-500 animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider">Syncing Dashboard Data...</span>
        </div>
      </div>
    );
  }

  // Format currency helper to INR (₹)
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  const activeStats = stats || defaultStats;

  const statCards = [
    {
      title: 'Inventory Value',
      value: formatCurrency(activeStats.totalValue),
      subtext: `${(activeStats.totalQuantity || 0).toLocaleString()} items total`,
      icon: DollarSign,
      colorClass: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      title: 'Total Products',
      value: activeStats.totalProducts || 0,
      subtext: 'Monitored categories',
      icon: Package,
      colorClass: 'text-primary-500 bg-primary-500/10'
    },
    {
      title: 'Low Stock Alerts',
      value: activeStats.lowStock || 0,
      subtext: 'Requires ordering soon',
      icon: AlertTriangle,
      colorClass: 'text-orange-500 bg-orange-500/10',
      badge: activeStats.lowStock > 0 ? `${activeStats.lowStock} warnings` : null,
      badgeColor: 'bg-orange-500/20 text-orange-400',
      link: '/products?status=low_stock'
    },
    {
      title: 'Out of Stock',
      value: activeStats.outOfStock || 0,
      subtext: 'Immediate restock required',
      icon: AlertOctagon,
      colorClass: 'text-red-500 bg-red-500/10',
      badge: activeStats.outOfStock > 0 ? `${activeStats.outOfStock} out` : null,
      badgeColor: 'bg-red-500/20 text-red-400',
      link: '/products?status=out_of_stock'
    },
    {
      title: 'Defective Stock',
      value: activeStats.defectiveItemsCount || 0,
      subtext: 'QA quarantine logs',
      icon: ShieldAlert,
      colorClass: 'text-purple-500 bg-purple-500/10',
      badge: activeStats.defectiveItemsCount > 0 ? `${activeStats.defectiveItemsCount} items` : null,
      badgeColor: 'bg-purple-500/20 text-purple-400',
      link: '/defects'
    },
    {
      title: 'Pending Transfers',
      value: activeStats.pendingTransfers || 0,
      subtext: 'Exchange approval queues',
      icon: Activity,
      colorClass: 'text-blue-500 bg-blue-500/10',
      badge: activeStats.pendingTransfers > 0 ? `${activeStats.pendingTransfers} pending` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400',
      link: '/transfers'
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Connection Warning Banner if offline */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            {errorMsg}
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} /> Retry Connection
          </button>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans dark:text-white">Warehouse Intelligence Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live analytics aggregates, reordering thresholds, and AI-predicted sales trends.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-850 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm self-start md:self-auto flex items-center gap-2"
        >
          <RefreshCw size={14} /> Force Sync Live DB
        </button>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const CardContent = (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-premium hover-glow flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${card.colorClass}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4 flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-slate-850 dark:text-white leading-none font-sans">{card.value}</span>
                  {card.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 leading-snug">{card.subtext}</span>
              </div>
            </div>
          );

          return card.link ? (
            <Link key={idx} to={card.link}>
              {CardContent}
            </Link>
          ) : (
            <div key={idx}>{CardContent}</div>
          );
        })}
      </div>

      {/* Main Charts & Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend chart card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-sans text-sm">Demand Forecast Trends</span>
              <span className="text-[10px] text-slate-400">Comparing active month actual sales against predicted future demand</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary-500 font-semibold uppercase tracking-wider">
              <TrendingUp size={14} />
              <span>Forecast Engine Active</span>
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            {forecastData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                Seeding sales history forecasting data needed to plot charts.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#457ba7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#457ba7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9dbcd7" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#9dbcd7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#94A3B8', fontSize: 10 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      borderRadius: '16px', 
                      border: 'none', 
                      color: '#fff', 
                      fontSize: '11px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                    }}
                    itemStyle={{ color: '#E2E8F0' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#94A3B8' }} />
                  <Area 
                    name="Actual Sales" 
                    type="monotone" 
                    dataKey="ActualSales" 
                    stroke="#457ba7" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorActual)" 
                  />
                  <Area 
                    name="Predicted Demand" 
                    type="monotone" 
                    dataKey="PredictedDemand" 
                    stroke="#9dbcd7" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorPred)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fast moving items card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex flex-col mb-4">
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-sans text-sm">Fast-Moving Inventory</span>
              <span className="text-[10px] text-slate-400 font-sans">Products with high monthly sales velocity and quick turnover</span>
            </div>

            <div className="flex flex-col gap-3.5">
              {fastMoving.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No sales history records available to rank turnover speeds.
                </div>
              ) : (
                fastMoving.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-850/50 bg-slate-50/50 dark:bg-slate-850/20">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">{item.sku} • {item.category}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.avgSalesPerMonth} / mo</span>
                      <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-medium">Stock: {item.currentStock}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link 
            to="/forecasting"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-semibold p-2.5 rounded-xl bg-primary-500/5 hover:bg-primary-500/10 transition-colors"
          >
            <span>View Forecasting Insights</span>
            <ArrowRight size={12} />
          </Link>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
