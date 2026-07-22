import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  Building2, 
  GitPullRequest, 
  ShoppingBag, 
  FileBarChart2, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const role = user?.role || 'staff';
  const userName = user?.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // Define navigation items
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff', 'branch_user'] },
    { name: 'Product Catalog', path: '/products', icon: Boxes, roles: ['admin', 'manager', 'staff', 'branch_user'] },
    { name: 'Demand Forecasting', path: '/forecasting', icon: TrendingUp, roles: ['admin', 'manager', 'branch_user'] },
    { name: 'Expiry Analytics', path: '/expiry', icon: Clock, roles: ['admin', 'manager', 'staff', 'branch_user'] },
    { name: 'Defect Management', path: '/defects', icon: AlertTriangle, roles: ['admin', 'manager', 'staff', 'branch_user'] },
    { name: 'Multi-Branch', path: '/branches', icon: Building2, roles: ['admin', 'manager'] },
    { name: 'Transfers & Exchange', path: '/transfers', icon: GitPullRequest, roles: ['admin', 'manager', 'branch_user'] },
    { name: 'Reports Center', path: '/reports', icon: FileBarChart2, roles: ['admin', 'manager'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'manager', 'staff', 'branch_user'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside 
      className={`h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-all duration-300 relative z-30 ${collapsed ? 'w-20' : 'w-64'}`}
    >
      <div>
        {/* Sidebar Brand header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg font-bold text-white text-lg">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight text-white font-sans">Smart Stock</span>
                <span className="text-[10px] text-slate-400">Warehouse Intel</span>
              </div>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center shadow-lg font-bold text-white text-lg mx-auto">
              S
            </div>
          )}

          {/* Collapse toggle button */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-5 -right-3 h-6 w-6 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center text-slate-300 shadow-md cursor-pointer"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="mt-6 px-3 flex flex-col gap-1.5">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            if (!Icon) return null;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group font-medium ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary-600/20 to-primary-500/5 text-primary-400 border border-primary-500/20 shadow-inner' 
                      : 'hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }`
                }
              >
                <Icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile footer info */}
      <div className="p-3 border-t border-slate-800">
        {!collapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 p-2 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm">
                {userInitial}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-white truncate">{userName}</span>
                <span className="text-[10px] text-slate-400 capitalize truncate">{role.replace('_', ' ')}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 cursor-pointer transition-colors"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm cursor-help" title={userName}>
              {userInitial}
            </div>
            <button
              onClick={logout}
              className="h-8 w-8 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
