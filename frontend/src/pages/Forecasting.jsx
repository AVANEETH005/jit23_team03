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
  Activity, 
  TrendingUp, 
  AlertOctagon, 
  Mail, 
  Sparkles,
  Calendar,
  Layers,
  ArrowRightLeft
} from 'lucide-react';

const Forecasting = () => {
  const { activeBranchId, token } = useAuth();
  const { triggerToast } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [fastMoving, setFastMoving] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [seasonalInsights, setSeasonalInsights] = useState([]);

  const fetchForecastingData = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch(`http://localhost:5000/api/forecast?branchId=${activeBranchId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTrendData(data.trendData || []);
        setFastMoving(data.fastMovingProducts || []);
        setRecommendations(data.reorderRecommendations || []);
        setSeasonalInsights(data.seasonalInsights || []);
      }
    } catch (err) {
      console.error('Failed to load forecast data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastingData();
  }, [activeBranchId]);

  const handleQuickReorder = (item) => {
    triggerToast(
      'success',
      'Reorder PO Sent',
      `Mock Purchase Order of ${item.recommendedReorderQty}x "${item.name}" sent to "${item.supplier}".`
    );
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <Activity size={24} className="text-primary-500 animate-spin" />
          <span className="text-xs text-slate-500 font-semibold tracking-wider">Calculating Demand Predictions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold font-sans dark:text-white">Demand Forecasting & Reordering</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Predictive analysis modeling next-month quantity needs and scheduling safety-stock orders.</p>
      </div>

      {/* Main Forecasting Trend line Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-850 dark:text-white text-sm">Historical vs Predicted Demand Curve</span>
            <span className="text-[10px] text-slate-400">Moving average trend projections computed over previous sales volumes</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary-500 font-bold uppercase tracking-wider">
            <TrendingUp size={14} />
            <span>AI Modeling Engines Online</span>
          </div>
        </div>

        <div className="h-72 w-full">
          {trendData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-450 text-xs">
              No historical data available. Run seed.js to populate chart records.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '16px', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: '11px' 
                  }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                <Area name="Actual Sales" type="monotone" dataKey="ActualSales" stroke="#457ba7" strokeWidth={2.5} fill="url(#colorActual)" />
                <Area name="Predicted Demand" type="monotone" dataKey="PredictedDemand" stroke="#9dbcd7" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#colorPred)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid for reorder suggest table & Insights cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reorder Suggestions Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex flex-col mb-4">
              <span className="font-semibold text-slate-850 dark:text-white text-sm">Predictive Reorder Schedule</span>
              <span className="text-[10px] text-slate-400">Products flagged for restocking due to threshold breaches or forecast demand surges</span>
            </div>

            <div className="overflow-x-auto">
              {recommendations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  All inventory quantities are healthy. No items flagged for reordering.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-2 text-right">Stock</th>
                      <th className="py-3 px-2 text-right">Proj Demand</th>
                      <th className="py-3 px-3 text-right">Order Suggest</th>
                      <th className="py-3 px-3 text-center">Urgency</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                    {recommendations.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                        <td className="py-3 px-4 font-semibold text-slate-850 dark:text-white">
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">{item.sku} • {item.branchName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-bold">{item.currentStock}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-500 dark:text-slate-400">{item.predictedDemand}</td>
                        <td className="py-3 px-3 text-right font-bold text-primary-500">+{item.recommendedReorderQty}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.priority === 'Critical' ? 'bg-red-500/20 text-red-500' :
                            item.priority === 'High' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleQuickReorder(item)}
                            className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 text-white text-[10px] font-semibold uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer mx-auto shadow-sm"
                          >
                            <Mail size={10} />
                            Reorder PO
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Seasonal Insights */}
        <div className="flex flex-col gap-6">
          
          {/* Insights card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium">
            <div className="flex flex-col mb-4">
              <span className="font-semibold text-slate-850 dark:text-white text-sm">Seasonal Category Analysis</span>
              <span className="text-[10px] text-slate-400">Demand adjustments calculated per product classification category</span>
            </div>

            <div className="flex flex-col gap-3">
              {seasonalInsights.map((insight, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/20 text-xs flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white">{insight.category}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      insight.trend === 'Upward Spike' ? 'bg-green-500/10 text-green-500' :
                      insight.trend === 'Downward Slump' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {insight.trend} ({insight.index}x)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{insight.insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sourcing summary card */}
          <div className="bg-gradient-to-tr from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-6 shadow-premium text-white flex flex-col gap-3">
            <div className="h-10 w-10 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-400">
              <Sparkles size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sm">Automated Smart Replenishment</span>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                Our inventory manager constantly aggregates historical run rates to auto-provision low-stock alerts. When an item hits its threshold, the system cross-references sibling branches in real-time, allowing you to quickly transfer excess stock rather than issuing duplicate purchases.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Forecasting;
