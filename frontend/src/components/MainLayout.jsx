import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatbotWidget from './ChatbotWidget';
import { Loader2 } from 'lucide-react';

const MainLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-100">
        <Loader2 size={32} className="text-primary-500 animate-spin" />
        <span className="text-xs font-semibold tracking-widest text-primary-400">LOADING INTELLIGENCE SYSTEM...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Navbar */}
        <Navbar />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 relative">
          <Outlet />
        </main>
      </div>

      {/* Domain-Specific Chatbot widget overlay */}
      <ChatbotWidget />

    </div>
  );
};

export default MainLayout;
