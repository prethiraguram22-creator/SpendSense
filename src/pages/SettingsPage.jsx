import React, { useState } from 'react';
import {
  User,
  Mail,
  DollarSign,
  Bell,
  Lock,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Shield,
  Moon,
  Sun,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { formatCurrency } from '../utils/formatters';

export const SettingsPage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { resetToDemoData, exportAllDataJSON, addToast } = useFinance();

  // Profile Form State
  const [name, setName] = useState(user?.name || 'Alex Sharma');
  const [email, setEmail] = useState(user?.email || 'alex.sharma@spendsense.io');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [monthlyIncomeTarget, setMonthlyIncomeTarget] = useState(user?.monthlyIncomeTarget?.toString() || '35000');

  // Notification Toggles
  const [notifications, setNotifications] = useState(
    user?.notifications || {
      budgetAlerts: true,
      overrunPredictions: true,
      weeklyReport: true,
      goalMilestones: true,
    }
  );

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // Dialog States
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleProfileSave = (e) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      currency,
      monthlyIncomeTarget: parseFloat(monthlyIncomeTarget) || 0,
      notifications,
    });
    addToast('Profile settings saved successfully', 'success');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ text: 'Please enter current password', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    setPasswordMsg({ text: 'Password updated successfully!', type: 'success' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    addToast('Password updated successfully', 'success');
  };

  const handleToggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleResetData = () => {
    resetToDemoData();
    setShowResetConfirm(false);
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    logout();
    addToast('Account wiped and logged out', 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal profile, notifications, security, and financial preferences.
        </p>
      </div>

      {/* 1. Profile Information */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
          <User className="w-4 h-4 text-teal-700" />
          <span>Profile Information</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Your account identity and personal target figures
        </p>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="INR">Indian Rupee (₹ INR)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
                <option value="GBP">British Pound (£ GBP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Income Target (₹)
              </label>
              <input
                type="number"
                value={monthlyIncomeTarget}
                onChange={(e) => setMonthlyIncomeTarget(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* 2. Notification Preferences */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
          <Bell className="w-4 h-4 text-teal-700" />
          <span>Notification Preferences</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Choose which intelligent alerts and insights SpendSense delivers to you
        </p>

        <div className="divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800">Budget Limit Warnings</p>
              <p className="text-[11px] text-slate-500">Alert when a category spending reaches 75% or 90%</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.budgetAlerts}
              onChange={() => handleToggleNotification('budgetAlerts')}
              className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600 cursor-pointer"
            />
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800">Overrun Predictions</p>
              <p className="text-[11px] text-slate-500">Early warnings when your spending velocity projects a deficit</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.overrunPredictions}
              onChange={() => handleToggleNotification('overrunPredictions')}
              className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600 cursor-pointer"
            />
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800">Goal Milestones</p>
              <p className="text-[11px] text-slate-500">Notify upon reaching 25%, 50%, 75% and 100% of savings goals</p>
            </div>
            <input
              type="checkbox"
              checked={notifications.goalMilestones}
              onChange={() => handleToggleNotification('goalMilestones')}
              className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Security: Change Password */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-teal-700" />
          <span>Security & Password</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Update your authentication password
        </p>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {passwordMsg.text && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-center ${
                passwordMsg.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* 4. Data Management & Export */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
          <Download className="w-4 h-4 text-teal-700" />
          <span>Data Management & Backup</span>
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Download copies of your financial records or restore original state
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportAllDataJSON}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4" />
            <span>Export Full Backup (JSON)</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100/80 text-amber-800 text-xs sm:text-sm font-semibold rounded-xl transition-colors border border-amber-200"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* 5. Danger Zone: Delete Account */}
      <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-subtle">
        <h3 className="text-base font-bold text-red-700 mb-1 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Permanently delete all stored financial records and reset application authentication state.
        </p>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account & Wipe Data</span>
        </button>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationDialog
        isOpen={showResetConfirm}
        title="Reset Demo Data"
        message="This will restore all transactions, budgets, and savings goals back to initial SpendSense demo records. Any custom items you added will be replaced."
        confirmText="Reset to Defaults"
        confirmVariant="danger"
        onConfirm={handleResetData}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Account & Data"
        message="Are you completely sure? This will remove all your data from browser storage and log you out. This action cannot be undone."
        confirmText="Permanently Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

