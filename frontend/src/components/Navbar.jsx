import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, Search, ShieldAlert, LogOut, CheckCheck, Mic, MicOff } from 'lucide-react';

const Navbar = () => {
  const { user, activeBranchId, setActiveBranchId } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setVoiceQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Navbar voice search error:', event.error);
        setIsVoiceSearching(false);
      };

      recognition.onend = () => {
        setIsVoiceSearching(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!user) return;
      if (user.role !== 'admin' && user.role !== 'manager') return;

      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/branches', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (err) {
        console.error('Failed to load branches in navbar:', err);
      }
    };

    fetchBranches();
  }, [user]);

  if (!user) return null;

  const handleBranchChange = (e) => {
    setActiveBranchId(e.target.value);
  };

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert('Voice detection is not supported in this browser. Try Google Chrome or Microsoft Edge.');
      return;
    }

    if (isVoiceSearching) {
      recognitionRef.current.stop();
      setIsVoiceSearching(false);
    } else {
      setVoiceQuery('');
      recognitionRef.current.start();
      setIsVoiceSearching(true);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      
      {/* Scope Switcher & Voice Search Bar */}
      <div className="flex items-center gap-4">
        {(user.role === 'admin' || user.role === 'manager') ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sans">Scope:</span>
            <select
              value={activeBranchId}
              onChange={handleBranchChange}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-1.5 font-medium outline-none focus:ring-1 focus:ring-primary-500 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">All Branches (Aggregated)</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name} {b.isWarehouse ? '(HQ)' : ''}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            📍 {user.branchId ? (branches.find(b => b._id === user.branchId)?.name || 'Local Branch') : 'Main Warehouse'}
          </div>
        )}

        {/* Global Voice Search Command Trigger */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={toggleVoiceSearch}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isVoiceSearching 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'text-slate-400 hover:text-primary-400'
            }`}
            title={isVoiceSearching ? "Listening..." : "Click to speak voice command"}
          >
            {isVoiceSearching ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-[150px] truncate">
            {isVoiceSearching ? (voiceQuery || "Listening...") : "Voice Search Active"}
          </span>
        </div>
      </div>

      {/* Right Actions Menu */}
      <div className="flex items-center gap-4">
        
        {/* Dark/Light mode trigger */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer transition-colors relative"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[9px] rounded-full h-4 w-4 flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              {/* Overlay Backdrop to close */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 font-sans">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllAsRead();
                        setShowNotifications(false);
                      }}
                      className="text-[10px] text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={12} />
                      Clear Checked
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No notifications or warnings.
                    </div>
                  ) : (
                    notifications.map(item => (
                      <div
                        key={item._id}
                        className={`p-3 border-b border-slate-100 dark:border-slate-850/50 flex items-start gap-2.5 transition-colors ${item.isRead ? 'opacity-60' : 'bg-primary-50/20 dark:bg-primary-500/5'}`}
                      >
                        <div 
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                          style={{
                            backgroundColor: 
                              item.type === 'out_of_stock' ? '#ef4444' : 
                              item.type === 'low_stock' ? '#f97316' : 
                              item.type === 'expiry_soon' ? '#eab308' : '#3b82f6'
                          }}
                        />
                        <div className="flex-1 flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                            {item.message}
                          </span>
                        </div>
                        {!item.isRead && (
                          <button
                            onClick={() => markAsRead(item._id)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Mark as read"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
          <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs select-none">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
