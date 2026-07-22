import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const tokenRef = useRef(null);

  // We fetch token from local storage or get from useAuth (since AuthProvider is parent, we can fetch from localStorage here to avoid circular dep)
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Check for new notifications to trigger toast
        if (notifications.length > 0) {
          const oldIds = new Set(notifications.map(n => n._id));
          const newItems = data.filter(n => !oldIds.has(n._id) && !n.isRead);
          
          newItems.forEach(n => {
            triggerToast(n.type, n.title, n.message);
          });
        }
        
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Polling every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  const triggerToast = (type, title, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Refresh notifications
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications: fetchNotifications, toasts, triggerToast }}>
      {children}
      
      {/* Toast Notification Container in Portal UI style */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="p-4 rounded-xl border glass shadow-lg flex flex-col gap-1 transition-all duration-300 animate-fade-in text-slate-800 dark:text-slate-100"
            style={{
              borderLeftWidth: '5px',
              borderLeftColor: 
                toast.type === 'out_of_stock' ? '#ef4444' : 
                toast.type === 'low_stock' ? '#f97316' : 
                toast.type === 'expiry_soon' ? '#eab308' : 
                toast.type === 'transfer_request' ? '#3b82f6' : '#22c55e'
            }}
          >
            <div className="font-semibold text-sm flex items-center justify-between">
              <span>{toast.title}</span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-xs text-slate-400 hover:text-slate-200 ml-2"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">{toast.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
