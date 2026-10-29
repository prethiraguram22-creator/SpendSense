import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export const BudgetOverviewCard = ({ budgetsWithProgress }) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Monthly Budgets</h3>
          <p className="text-xs text-slate-500">Spending limits & utilization</p>
        </div>
        <Link
          to="/budgets"
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center group"
        >
          Manage <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="space-y-4">
        {budgetsWithProgress.slice(0, 4).map((b) => {
          const isExceeded = b.percentage >= 100;
          const isWarning = b.percentage >= 75 && !isExceeded;

          let barColor = 'bg-teal-600';
          let textColor = 'text-teal-700';
          let statusLabel = 'On track';
          let StatusIcon = CheckCircle;

          if (isExceeded) {
            barColor = 'bg-red-600';
            textColor = 'text-red-700 font-semibold';
            statusLabel = `Over budget (by ${formatCurrency(b.overspent)})`;
            StatusIcon = AlertCircle;
          } else if (isWarning) {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-700 font-semibold';
            statusLabel = `${formatCurrency(b.remaining)} remaining - Near limit`;
            StatusIcon = AlertTriangle;
          } else {
            statusLabel = `${formatCurrency(b.remaining)} remaining`;
          }

          return (
            <div key={b.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-slate-800">{b.category}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{formatCurrency(b.spent)} of {formatCurrency(b.amount)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <StatusIcon className={`w-3 h-3 ${textColor}`} />
                  <span className={`text-[11px] ${textColor}`}>{formatPercentage(b.percentage)}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                />
              </div>

              {/* Readable status text */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Status: <strong className={textColor}>{statusLabel}</strong></span>
                {b.potentialOverrun > 0 && (
                  <span className="text-amber-600 font-medium">
                    Est. overrun: +{formatCurrency(b.potentialOverrun)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Active Categories: {budgetsWithProgress.length}</span>
        <Link to="/budgets" className="text-teal-700 font-medium hover:underline">
          View all category budgets &rarr;
        </Link>
      </div>
    </div>
  );
};

