import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  User,
  Settings,
  LogOut,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';

export const TopNavbar = ({ onOpenMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedMonth, setSelectedMonth, dynamicInsights, budgetsWithProgress } = useFinance();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current page title
  const getPageDetails = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Dashboard', subtitle: 'Overview & financial health' };
    if (path.startsWith('/transactions')) return { title: 'Transactions', subtitle: 'Track every rupee in and out' };
    if (path.startsWith('/budgets')) return { title: 'Budgets', subtitle: 'Monitor category spending limits' };
    if (path.startsWith('/savings-goals')) return { title: 'Savings Goals', subtitle: 'Plan and reach milestones' };
    if (path.startsWith('/insights')) return { title: 'SpendSense Insights', subtitle: 'Intelligent predictions & habits' };
    if (path.startsWith('/settings')) return { title: 'Settings', subtitle: 'Preferences & account controls' };
    return { title: 'SpendSense', subtitle: 'Smart personal finance' };
  };

  const { title } = getPageDetails();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Month selector options
  const monthOptions = [
    { label: 'October 2026', value: '2026-10' },
    { label: 'September 2026', value: '2026-09' },
    { label: 'August 2026', value: '2026-08' },
    { label: 'July 2026', value: '2026-07' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'May 2026', value: '2026-05' },
  ];

  // Derive notifications from insights and over-budget items
  const notifications = [
    ...budgetsWithProgress
      .filter(b => b.percentage >= 90)
      .map(b => ({
        id: `notif-b-${b.id}`,
        title: `${b.category} Budget Alert`,
        message: `Used ${b.percentage}% of your ₹${b.amount.toLocaleString('en-IN')} limit.`,
        type: b.percentage >= 100 ? 'danger' : 'warning',
        time: 'Today',
      })),
    ...dynamicInsights.slice(0, 3).map((insight, idx) => ({
      id: `notif-ins-${idx}`,
      title: insight.title,
      message: insight.description,
      type: insight.type || 'info',
      time: 'Just now',
    })),
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Middle / Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Search Input (Hidden on extra small mobile, visible on sm+) */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 lg:w-64 pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
          />
        </form>

        {/* Current Month Selector */}
        <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-700 hover:border-slate-300 transition-colors">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 mr-2 flex-shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer pr-1 text-xs sm:text-sm"
            aria-label="Select month"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Icon with Badge */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-float border border-slate-200 py-3 z-50 animate-scale-up">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-slate-900">Notifications</span>
                  <span className="text-xs bg-teal-50 text-teal-700 font-medium px-2 py-0.5 rounded-full border border-teal-200">
                    {notifications.length} alerts
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Live Insights</span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No active alerts. Your budgets and finances look healthy!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 hover:bg-slate-50 transition-colors flex items-start space-x-3 cursor-pointer"
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/insights');
                      }}
                    >
                      <div
                        className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                          n.type === 'danger'
                            ? 'bg-red-50 text-red-600'
                            : n.type === 'warning'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-teal-50 text-teal-600'
                        }`}
                      >
                        {n.type === 'danger' || n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 inline-block">
                          {n.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-4 border-t border-slate-100 flex justify-between">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/insights');
                  }}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800"
                >
                  View All Insights &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="User profile options"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
              alt={user?.name || 'Alex'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-600/30"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-float border border-slate-200 py-2 z-50 animate-scale-up">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.name || 'Alex Sharma'}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || 'alex.sharma@spendsense.io'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Preferences</span>
                </button>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

