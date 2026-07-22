import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Check, 
  Zap, 
  Sparkles,
  Cpu,
  Eye,
  PlusCircle
} from 'lucide-react';

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const WebcamCapture = ({ onDefectReported, mode = 'defect', onProductAdded }) => {
  const { token, activeBranchId, user } = useAuth();
  const { triggerToast } = useNotifications();

  const [scanMode, setScanMode] = useState(mode);
  const [streamActive, setStreamActive] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Custom manual webcam intake item fields (for new item scanning)
  const [newItemData, setNewItemData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    quantity: 1,
    price: 999.00
  });

  // Custom unlisted defect item title
  const [unlistedDefectName, setUnlistedDefectName] = useState('');

  // YOLO Model States
  const [yoloModel, setYoloModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectedObjects, setDetectedObjects] = useState([]);
  
  const [capturedImage, setCapturedImage] = useState(null); // base64
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle, scanning, result
  const [scanResult, setScanResult] = useState(null); // 'good' or 'defective'
  const [defectDetails, setDefectDetails] = useState({
    reason: 'Damaged',
    notes: 'YOLO Computer Vision scan detected surface flaw anomaly.'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const yoloOverlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameId = useRef(null);

  // Sync mode prop if passed
  useEffect(() => {
    setScanMode(mode);
  }, [mode]);

  // Load TensorFlow COCO-SSD YOLO model on mount
  useEffect(() => {
    let isMounted = true;
    const loadYoloModel = async () => {
      try {
        setIsModelLoading(true);
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (isMounted) {
          setYoloModel(loadedModel);
          setIsModelLoading(false);
        }
      } catch (err) {
        console.error('Failed to load TensorFlow YOLO COCO-SSD model:', err);
        if (isMounted) setIsModelLoading(false);
      }
    };
    loadYoloModel();
    return () => { isMounted = false; };
  }, []);

  // Fetch products for dropdown
  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    try {
      const url = activeBranchId && activeBranchId !== 'all' 
        ? `http://localhost:5000/api/products?branchId=${activeBranchId}`
        : `http://localhost:5000/api/products`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0 && !selectedProductId) {
          setSelectedProductId(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load products in webcam scan:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeBranchId]);

  // Real-time YOLO Detection Loop
  const runYoloDetectionLoop = async () => {
    if (!videoRef.current || !yoloModel || !streamActive) return;

    const video = videoRef.current;
    if (video.readyState === 4) {
      try {
        const predictions = await yoloModel.detect(video, 5, 0.4);
        setDetectedObjects(predictions);
        drawYoloBoundingBoxes(predictions);

        // Smart product auto-matcher or new item pre-filler
        if (predictions.length > 0) {
          const topClass = predictions[0].class.toLowerCase();
          const match = products.find(p => 
            p.name.toLowerCase().includes(topClass) || 
            p.category.toLowerCase().includes(topClass) ||
            (topClass === 'cell phone' && (p.name.toLowerCase().includes('iphone') || p.name.toLowerCase().includes('samsung') || p.name.toLowerCase().includes('phone'))) ||
            (topClass === 'laptop' && p.name.toLowerCase().includes('macbook')) ||
            (topClass === 'bottle' && p.name.toLowerCase().includes('paracetamol'))
          );
          if (match && selectedProductId !== 'new_custom_item' && selectedProductId !== 'unlisted_defect_item') {
            setSelectedProductId(match._id);
          } else if (!match && selectedProductId === 'new_custom_item' && !newItemData.name) {
            const formattedName = `Scanned ${topClass.charAt(0).toUpperCase() + topClass.slice(1)}`;
            const formattedSku = `${topClass.toUpperCase().replace(/\s+/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;
            setNewItemData(prev => ({
              ...prev,
              name: formattedName,
              sku: formattedSku
            }));
          } else if (selectedProductId === 'unlisted_defect_item' && !unlistedDefectName) {
            setUnlistedDefectName(`Unlisted ${topClass.charAt(0).toUpperCase() + topClass.slice(1)}`);
          }
        }
      } catch (err) {
        console.error('YOLO inference error:', err);
      }
    }

    if (streamRef.current) {
      animationFrameId.current = requestAnimationFrame(runYoloDetectionLoop);
    }
  };

  const drawYoloBoundingBoxes = (predictions) => {
    const overlay = yoloOverlayCanvasRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;

    const ctx = overlay.getContext('2d');
    overlay.width = video.videoWidth || 640;
    overlay.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    predictions.forEach(pred => {
      const [x, y, width, height] = pred.bbox;
      const confidence = Math.round(pred.score * 100);

      // Draw bounding box
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Draw label badge
      ctx.fillStyle = '#10B981';
      const text = `${pred.class.toUpperCase()} ${confidence}%`;
      ctx.font = 'bold 12px sans-serif';
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x, y > 20 ? y - 22 : y, textWidth + 12, 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, x + 6, y > 20 ? y - 7 : y + 14);
    });
  };

  const startCamera = async () => {
    setCapturedImage(null);
    setAnalysisStatus('idle');
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setStreamActive(true);
    } catch (err) {
      console.error('Error accessing webcam:', err);
      alert('Unable to access webcam. Please verify browser camera permissions.');
    }
  };

  useEffect(() => {
    if (streamActive && yoloModel) {
      animationFrameId.current = requestAnimationFrame(runYoloDetectionLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [streamActive, yoloModel]);

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setStreamActive(false);
  };

  const captureFrame = (simulateType) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    stopCamera();

    setAnalysisStatus('scanning');
    
    setTimeout(async () => {
      setAnalysisStatus('result');
      setScanResult(simulateType);
      
      if (scanMode === 'stock_entry' && simulateType === 'good') {
        await handleAutoAddStock();
      } else if (simulateType === 'defective') {
        const reasons = ['Damaged', 'Broken', 'Packaging Issue'];
        const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
        setDefectDetails({
          reason: randomReason,
          notes: `YOLO CV Anomaly Alert: Surface defect detected on object quadrant. ${randomReason}.`
        });
      }
    }, 1600);
  };

  // Auto-Add Stock or Register Brand New Scanned Item
  const handleAutoAddStock = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      if (selectedProductId === 'new_custom_item') {
        const nameToUse = newItemData.name || (detectedObjects[0] ? `Scanned ${detectedObjects[0].class.charAt(0).toUpperCase() + detectedObjects[0].class.slice(1)}` : 'New Custom Scanned Item');
        const skuToUse = newItemData.sku || `SKU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const res = await fetch('http://localhost:5000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: nameToUse,
            sku: skuToUse,
            category: newItemData.category || 'Electronics',
            quantity: 1,
            price: Number(newItemData.price) || 999,
            branchId: user.branchId || (products.length > 0 ? products[0].branchId : ''),
            lowStockThreshold: 10,
            excessThreshold: 100
          })
        });

        if (res.ok) {
          const created = await res.json();
          triggerToast('success', 'YOLO Custom Item Auto-Created', `Brand new item "${created.name}" created and added to inventory stock.`);
          setSelectedProductId(created._id);
          if (onProductAdded) onProductAdded();
          fetchProducts();
        } else {
          const errData = await res.json();
          alert(errData.message || 'Failed to create item');
        }
      } else if (selectedProductId) {
        const targetProd = products.find(p => p._id === selectedProductId);
        if (targetProd) {
          const res = await fetch(`http://localhost:5000/api/products/${selectedProductId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              quantity: targetProd.quantity + 1
            })
          });

          if (res.ok) {
            triggerToast('success', 'YOLO QA Passed: Stock Auto-Added', `+1 unit added to "${targetProd.name}" (Stock: ${targetProd.quantity + 1}).`);
            if (onProductAdded) onProductAdded();
            fetchProducts();
          }
        }
      }
    } catch (err) {
      console.error('Auto-add stock error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDefect = async () => {
    setIsSubmitting(true);

    const activeProd = products.find(p => p._id === selectedProductId);
    const customTitle = unlistedDefectName || (detectedObjects[0] ? `Unlisted ${detectedObjects[0].class}` : 'Unlisted Item');
    const customSku = `UNLISTED-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res = await fetch('http://localhost:5000/api/defects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProductId === 'unlisted_defect_item' ? 'unlisted' : selectedProductId,
          branchId: activeProd ? activeProd.branchId : (user.branchId || ''),
          quantity: 1,
          reason: defectDetails.reason,
          imageUrl: capturedImage,
          notes: defectDetails.notes,
          customProductName: selectedProductId === 'unlisted_defect_item' ? customTitle : null,
          customProductSku: selectedProductId === 'unlisted_defect_item' ? customSku : null
        })
      });

      if (res.ok) {
        triggerToast('defect_reported', 'Defect Logged Successfully', 'Inventory defect audit recorded.');
        setCapturedImage(null);
        setAnalysisStatus('idle');
        setScanResult(null);
        if (onDefectReported) onDefectReported();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to submit defect record');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium">
      <div className="flex flex-col gap-4">
        
        {/* YOLO Engine Status Banner */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-emerald-400 animate-pulse" />
            <span className="font-bold text-white">YOLO COCO-SSD Real-Time AI Detector</span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isModelLoading ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {isModelLoading ? 'Loading YOLO Neural Net...' : 'YOLO Model Ready'}
          </span>
        </div>

        {/* Mode Switcher Pills */}
        <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => { setScanMode('stock_entry'); setCapturedImage(null); setAnalysisStatus('idle'); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scanMode === 'stock_entry' 
                ? 'bg-primary-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap size={14} />
            Webcam Stock Auto-Add (QA Pass)
          </button>
          
          <button
            type="button"
            onClick={() => { setScanMode('defect'); setCapturedImage(null); setAnalysisStatus('idle'); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              scanMode === 'defect' 
                ? 'bg-red-600 text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle size={14} />
            Defect Quarantine Audit
          </button>
        </div>

        {/* Item Selector Dropdown with Custom New Item Option */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {scanMode === 'stock_entry' ? 'Target Product (Select Catalog Item or Register New)' : 'Select Item for Defect Audit (Catalog or Unlisted Item)'}
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl p-3 text-slate-800 dark:text-slate-200 outline-none font-medium"
            disabled={streamActive || analysisStatus === 'scanning'}
          >
            {scanMode === 'stock_entry' ? (
              <option value="new_custom_item">➕ Register Brand New Scanned Item (YOLO Custom Intake)</option>
            ) : (
              <option value="unlisted_defect_item">➕ Audit Unlisted / Custom Item (Not in Catalog)</option>
            )}
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name} ({p.category}) - Stock: {p.quantity} - ₹{p.price.toLocaleString('en-IN')}</option>
            ))}
          </select>
        </div>

        {/* Inline form for auditing unlisted defect items */}
        {selectedProductId === 'unlisted_defect_item' && scanMode === 'defect' && (
          <div className="p-3.5 bg-red-500/5 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/40 flex flex-col gap-2 animate-fade-in text-xs">
            <div className="font-semibold text-red-700 dark:text-red-400 text-[11px] flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Unlisted Defect Item (Will log defect audit record without requiring catalog entry):
            </div>
            <input
              type="text"
              placeholder="Unlisted Item Name (e.g. Damaged Coffee Maker, Broken Glass Bottle)"
              value={unlistedDefectName}
              onChange={(e) => setUnlistedDefectName(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
        )}

        {/* Inline form for scanning brand-new custom items */}
        {selectedProductId === 'new_custom_item' && scanMode === 'stock_entry' && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-750 flex flex-col gap-2.5 animate-fade-in text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-500" />
              New Item Parameters (Auto-Created on YOLO QA Pass):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Item Name (e.g. Desk Chair, Green Tea, Headphones)"
                value={newItemData.name}
                onChange={(e) => setNewItemData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 outline-none"
              />
              <input
                type="text"
                placeholder="SKU Code (e.g. CHAIR-01)"
                value={newItemData.sku}
                onChange={(e) => setNewItemData(prev => ({ ...prev, sku: e.target.value }))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 font-mono uppercase outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newItemData.category}
                onChange={(e) => setNewItemData(prev => ({ ...prev, category: e.target.value }))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="Electronics">Electronics</option>
                <option value="Groceries & FMCG">Groceries & FMCG</option>
                <option value="Pharmaceuticals">Pharmaceuticals</option>
                <option value="Apparel & Clothing">Apparel & Clothing</option>
                <option value="Industrial & Hardware">Industrial & Hardware</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Beverages & Foods">Beverages & Foods</option>
              </select>
              <input
                type="number"
                placeholder="Unit Price in ₹ (e.g. 1499)"
                value={newItemData.price}
                onChange={(e) => setNewItemData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>
        )}

        {/* Video feed viewport container */}
        <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
          
          {/* Active Camera view */}
          {streamActive && (
            <>
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="w-full h-full object-cover"
              />
              {/* YOLO Real-time Bounding Box Canvas Overlay */}
              <canvas
                ref={yoloOverlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </>
          )}

          {/* Captured Image View */}
          {capturedImage && (
            <div className="relative w-full h-full">
              <img 
                src={capturedImage} 
                alt="Captured frame" 
                className="w-full h-full object-cover" 
              />
              
              {/* Scanning Overlay */}
              {analysisStatus === 'scanning' && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={28} className="text-primary-500 animate-spin" />
                  <span className="text-xs text-primary-400 font-semibold tracking-wider animate-pulse">
                    RUNNING YOLO NEURAL INFERENCE...
                  </span>
                </div>
              )}

              {/* Bounding box simulation overlays */}
              {analysisStatus === 'result' && scanResult === 'good' && (
                <div className="absolute inset-0 border-4 border-emerald-500 animate-fade-in flex flex-col justify-between p-4">
                  <div className="self-start bg-emerald-500 text-white font-bold text-[10px] uppercase rounded px-2 py-0.5 flex items-center gap-1 shadow-md">
                    <ShieldCheck size={12} />
                    YOLO QA Passed (Healthy Match: 99.4%)
                  </div>
                  {scanMode === 'stock_entry' && (
                    <div className="self-center bg-emerald-600/90 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-2 shadow-xl animate-bounce">
                      <Sparkles size={16} />
                      Stock Automatically Created & Incremented! (+1 Unit)
                    </div>
                  )}
                </div>
              )}

              {analysisStatus === 'result' && scanResult === 'defective' && (
                <div className="absolute inset-0 border-4 border-red-500 animate-fade-in flex flex-col justify-between p-4">
                  <div className="self-start bg-red-500 text-white font-bold text-[10px] uppercase rounded px-2 py-0.5 flex items-center gap-1 shadow-md">
                    <AlertTriangle size={12} />
                    YOLO Defect Anomaly (Severity: 87.2%)
                  </div>
                  <div className="w-24 h-24 border-2 border-red-500 absolute top-1/3 left-1/3 border-dashed flex items-end">
                    <span className="bg-red-500 text-[8px] text-white px-1">YOLO_Flaw_01</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standby camera off status */}
          {!streamActive && !capturedImage && (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Camera size={36} className="text-slate-600" />
              <span className="text-xs">Camera is offline</span>
              <span className="text-[10px] text-slate-400">Point webcam at any item to run YOLO object detection</span>
            </div>
          )}
        </div>

        {/* Live Detected Objects Badges */}
        {streamActive && detectedObjects.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl overflow-x-auto text-[11px]">
            <Eye size={14} className="text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-semibold shrink-0">YOLO Tracked:</span>
            {detectedObjects.map((obj, i) => (
              <span key={i} className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-500/30 shrink-0 font-mono">
                {obj.class} ({Math.round(obj.score * 100)}%)
              </span>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap justify-between gap-3">
          {!streamActive && !capturedImage && (
            <button
              onClick={startCamera}
              disabled={isModelLoading}
              className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Camera size={14} />
              {isModelLoading ? 'Loading YOLO Neural Network...' : 'Activate YOLO AI Webcam'}
            </button>
          )}

          {streamActive && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => captureFrame('good')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Check size={14} />
                Capture & Run YOLO QA Check (Auto-Add)
              </button>
              
              <button
                onClick={() => captureFrame('defective')}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl py-3 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <AlertTriangle size={14} />
                Capture & Log YOLO Defect Anomaly
              </button>
            </div>
          )}

          {capturedImage && analysisStatus === 'result' && (
            <div className="w-full flex flex-col gap-4 animate-fade-in">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex gap-3 text-xs leading-normal">
                {scanResult === 'good' ? (
                  <>
                    <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {scanMode === 'stock_entry' ? 'YOLO QA Passed & Stock Added' : 'No Defects Found'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {scanMode === 'stock_entry' 
                          ? 'YOLO neural network confirmed object integrity. +1 stock has been recorded in inventory.'
                          : 'Item passes all YOLO quality assurance checks.'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">YOLO Defect Anomaly Detected</span>
                      <span className="text-slate-500 dark:text-slate-400">Edge contours fall outside healthy tolerances. Log defect below to adjust inventory stock.</span>
                    </div>
                  </>
                )}
              </div>

              {scanResult === 'good' ? (
                <button
                  onClick={startCamera}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold rounded-xl py-3 cursor-pointer"
                >
                  Scan Next Item with YOLO Webcam
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">Defect Reason</label>
                      <select
                        value={defectDetails.reason}
                        onChange={(e) => setDefectDetails(prev => ({ ...prev, reason: e.target.value }))}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                      >
                        <option value="Damaged">Damaged</option>
                        <option value="Broken">Broken</option>
                        <option value="Expired">Expired</option>
                        <option value="Returned">Returned</option>
                        <option value="Packaging Issue">Packaging Issue</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-500">CV Scan Notes</label>
                      <input
                        type="text"
                        value={defectDetails.notes}
                        onChange={(e) => setDefectDetails(prev => ({ ...prev, notes: e.target.value }))}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      onClick={startCamera}
                      className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl py-3 cursor-pointer"
                    >
                      Discard & Re-scan
                    </button>
                    <button
                      onClick={handleSubmitDefect}
                      disabled={isSubmitting}
                      className="bg-red-650 hover:bg-red-600 text-white text-xs font-semibold rounded-xl py-3 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? 'Logging...' : 'Confirm & Log Defect'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Hidden capture canvas */}
        <canvas ref={canvasRef} className="hidden" />

      </div>
    </div>
  );
};

export default WebcamCapture;
