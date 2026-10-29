import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useFinance();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map(toast => {
        let bg = 'bg-slate-900 text-white';
        let Icon = Info;
        if (toast.type === 'success') {
          bg = 'bg-teal-800 text-white border-l-4 border-teal-400';
          Icon = CheckCircle2;
        } else if (toast.type === 'danger' || toast.type === 'error') {
          bg = 'bg-red-800 text-white border-l-4 border-red-400';
          Icon = AlertCircle;
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-800 text-white border-l-4 border-amber-400';
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-lg shadow-float text-sm transition-all duration-200 animate-slide-up ${bg}`}
          >
            <div className="flex items-center space-x-2.5">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-xs sm:text-sm">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

