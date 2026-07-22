import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import WebcamCapture from '../components/WebcamCapture';
import { 
  AlertTriangle, 
  Loader2, 
  Calendar, 
  User, 
  X, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

const Defects = () => {
  const { user, token } = useAuth();
  
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // base64 zoomed image

  const fetchDefects = async () => {
    setLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const res = await fetch('http://localhost:5000/api/defects', { headers });
      if (res.ok) {
        const data = await res.json();
        setDefects(data);
      }
    } catch (err) {
      console.error('Failed to load defects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/defects/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchDefects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold font-sans dark:text-white">Defect Items Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit defective stock, perform webcam-based visual inspections, and record product quarantine logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Live Webcam scanning module */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm font-sans">Visual QA Scan Workspace</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Stream webcam feed to run edge contours and detect damaged packaging</span>
          </div>
          <WebcamCapture onDefectReported={fetchDefects} />
        </div>

        {/* Right Column: Historical Defect Logs */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium">
          <div className="flex flex-col mb-4">
            <span className="font-semibold text-slate-850 dark:text-white text-sm font-sans">Quarantine Log History</span>
            <span className="text-[10px] text-slate-400">Inventory items subtracted from sellable listings due to damage or expiry defects</span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="animate-spin text-primary-500 mx-auto mb-2" size={20} />
              <span className="text-xs text-slate-500">Querying defect logs...</span>
            </div>
          ) : defects.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No defect logs reported for your branch branches.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-2 text-center">Qty</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3">Reporter</th>
                    <th className="py-3 px-3 text-center">Photo</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                  {defects.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10">
                      
                      {/* Name / Branch */}
                      <td className="py-3.5 px-4 font-semibold text-slate-850 dark:text-white">
                        <div className="flex flex-col">
                          <span>{item.productName}</span>
                          <span className="text-[9px] text-slate-400 font-normal uppercase tracking-wider">{item.productSku} • {item.branchName}</span>
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="py-3.5 px-2 text-center font-bold">{item.quantity}</td>

                      {/* Reason */}
                      <td className="py-3.5 px-3">
                        <span className="bg-red-500/10 text-red-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.reason}
                        </span>
                      </td>

                      {/* Reporter / Date */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col text-[10px] gap-0.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{item.reportedBy}</span>
                          <span className="text-[8px] text-slate-450 flex items-center gap-0.5">
                            <Calendar size={10} />
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-3.5 px-3 text-center">
                        {item.imageUrl ? (
                          <button
                            onClick={() => setSelectedImage({ name: item.productName, url: item.imageUrl, notes: item.notes })}
                            className="h-8 w-8 rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all inline-block shadow-sm"
                            title="Zoom inspect photo"
                          >
                            <img src={item.imageUrl} alt="Defect shot" className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-slate-400"><ImageIcon size={14} className="mx-auto opacity-40" /></span>
                        )}
                      </td>

                      {/* Status / Review actions */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Pending Review' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                          }`}>
                            {item.status}
                          </span>
                          
                          {item.status === 'Pending Review' && user.role !== 'staff' && (
                            <button
                              onClick={() => handleUpdateStatus(item._id, 'Stock Adjusted')}
                              className="text-[9px] text-primary-500 hover:text-primary-600 font-bold uppercase underline cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* PHOTO ZOOM INSPECTION MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 shadow-2xl animate-fade-in text-slate-800 dark:text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-850 pb-3">
              <h3 className="font-bold text-sm font-sans uppercase tracking-wider">Defect Image Zoom: {selectedImage.name}</h3>
              <button 
                onClick={() => setSelectedImage(null)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800">
              <img src={selectedImage.url} alt="Large captured frame" className="w-full h-full object-contain" />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <span className="font-bold block text-slate-850 dark:text-slate-200 mb-0.5">Scan Diagnostics:</span>
              {selectedImage.notes || 'No description notes supplied.'}
            </div>

            <button
              onClick={() => setSelectedImage(null)}
              className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold rounded-xl py-3 cursor-pointer"
            >
              Close Diagnostics View
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Defects;
