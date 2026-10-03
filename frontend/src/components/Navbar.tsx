import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, Search, LogOut, CheckCircle2, ChevronDown, 
  Sparkles, ExternalLink, ShieldCheck, UserCheck 
} from 'lucide-react';
import api from '../api/client';
import { Link } from 'react-router-dom';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  category: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: NotificationItem) => !n.is_read).length);
    } catch (err) {
      // quiet
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'student': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'faculty': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'hod': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left branding & search */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-lg tracking-tight">CC</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">CampusConnect</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">Portal</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-1 hidden sm:block">Unified College Management Platform</p>
            </div>
          </Link>

          <div className="relative hidden md:block w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search courses, notices, roster..." 
              className="w-full bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          
          {/* Notification dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-slide-up">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-rose-50 text-rose-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead} 
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-3.5 hover:bg-slate-50 transition-colors flex gap-3 ${!n.is_read ? 'bg-indigo-50/40' : ''}`}
                      >
                        <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile badge */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-200"
              />
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                  {user.roll_number || user.employee_id || user.email}
                </p>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
