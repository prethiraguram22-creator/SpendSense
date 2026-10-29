import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const SummaryCard = ({
  title,
  amount,
  subtitle,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  isInverse = false, // If true, negative change is good (e.g., lower expenses)
  icon: Icon,
  iconColor = 'text-teal-700 bg-teal-50',
  additionalInfo,
}) => {
  // Determine if trend indicator is good or bad
  let badgeColor = 'bg-slate-100 text-slate-700';
  let TrendIcon = Minus;

  if (change !== undefined && change !== null) {
    const isPositive = Number(change) > 0;
    const isNegative = Number(change) < 0;

    if (isPositive) {
      TrendIcon = ArrowUpRight;
      badgeColor = isInverse 
        ? 'bg-red-50 text-red-700 border border-red-200' 
        : 'bg-green-50 text-green-700 border border-green-200';
    } else if (isNegative) {
      TrendIcon = ArrowDownRight;
      badgeColor = isInverse 
        ? 'bg-green-50 text-green-700 border border-green-200' 
        : 'bg-red-50 text-red-700 border border-red-200';
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle hover:shadow-card transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          {formatCurrency(amount)}
        </h3>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {change !== undefined && change !== null ? (
          <div className="flex items-center space-x-1.5">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${badgeColor}`}>
              <TrendIcon className="w-3 h-3 mr-0.5" />
              {Math.abs(change)}%
            </span>
            <span className="text-slate-500">{subtitle || 'vs last month'}</span>
          </div>
        ) : (
          <span className="text-slate-500">{subtitle}</span>
        )}

        {additionalInfo && (
          <span className="font-medium text-slate-700">
            {additionalInfo}
          </span>
        )}
      </div>
    </div>
  );
};

