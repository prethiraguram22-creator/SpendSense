import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { apiService } from '../services/api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: '', success: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus({ loading: false, error: 'Reset token is missing or invalid.', success: false });
      return;
    }
    if (password.length < 6) {
      setStatus({ loading: false, error: 'Password must be at least 6 characters.', success: false });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ loading: false, error: 'Passwords do not match.', success: false });
      return;
    }

    setStatus({ loading: true, error: '', success: false });
    try {
      const res = await apiService.resetPassword(token, password);
      if (res.success) {
        setStatus({ loading: false, error: '', success: true });
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setStatus({ loading: false, error: res.error || 'Failed to reset password', success: false });
      }
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Error occurred while resetting password', success: false });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex justify-center mb-4">
          <Logo size="lg" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Enter your new password to regain access to your SpendSense account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-float rounded-2xl border border-slate-200 sm:px-10">
          {status.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{status.error}</span>
            </div>
          )}

          {status.success && (
            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>Password reset successfully! Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={status.loading || status.success}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                <span>{status.loading ? 'Updating Password...' : 'Save New Password'}</span>
                {!status.loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

