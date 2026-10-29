import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  PieChart,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  PiggyBank,
  ArrowRight,
  Info,
} from 'lucide-react';

const iconMap = {
  PieChart,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  PiggyBank,
  Info,
};

export const InsightsBanner = ({ insights }) => {
  const navigate = useNavigate();

  if (!insights || insights.length === 0) return null;

  const handleAction = (insight) => {
    if (insight.actionTarget === 'budgets') {
      navigate('/budgets');
    } else if (insight.actionTarget === 'insights') {
      navigate('/insights');
    } else if (insight.actionFilter?.category) {
      navigate(`/transactions?category=${encodeURIComponent(insight.actionFilter.category)}`);
    } else {
      navigate('/insights');
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-float relative overflow-hidden">
      {/* Background ambient pattern */}
      <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-teal-400/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 relative z-10 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
            <Sparkles className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center space-x-2">
              <span>Your Money Insights</span>
              <span className="text-[10px] font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                SpendSense AI
              </span>
            </h3>
            <p className="text-xs text-teal-200/80">
              Personalized intelligence based on your actual spending habits
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/insights')}
          className="text-xs font-semibold text-teal-300 hover:text-white flex items-center group transition-colors self-start sm:self-auto"
        >
          <span>Explore All Analytics</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
        {insights.slice(0, 3).map((insight) => {
          const IconComponent = iconMap[insight.icon] || Sparkles;

          let badgeBg = 'bg-white/10 text-white';
          if (insight.type === 'danger') {
            badgeBg = 'bg-red-500/20 text-red-200 border border-red-500/30';
          } else if (insight.type === 'warning') {
            badgeBg = 'bg-amber-500/20 text-amber-200 border border-amber-500/30';
          } else if (insight.type === 'success') {
            badgeBg = 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30';
          }

          return (
            <div
              key={insight.id}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/15 flex flex-col justify-between hover:bg-white/15 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-white/10 text-teal-300">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs text-white">
                      {insight.title}
                    </span>
                  </div>
                  {insight.badgeText && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                      {insight.badgeText}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-200 leading-relaxed mt-1">
                  {insight.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-teal-200/60 font-medium">
                  {insight.isEstimate ? 'Calculated Projection' : 'Verified Spending'}
                </span>
                {insight.actionLabel && (
                  <button
                    onClick={() => handleAction(insight)}
                    className="text-[11px] font-semibold text-teal-300 hover:text-white flex items-center space-x-1 transition-colors"
                  >
                    <span>{insight.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

