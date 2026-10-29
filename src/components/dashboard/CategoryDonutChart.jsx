import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { CATEGORIES } from '../../data/demoData';

const getCategoryColor = (catName) => {
  const match = CATEGORIES.find(c => c.name.toLowerCase() === (catName || '').toLowerCase());
  return match ? match.color : '#94A3B8';
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-float text-xs border border-slate-700">
        <p className="font-semibold text-slate-200">{data.name}</p>
        <p className="text-teal-400 font-bold mt-0.5">{formatCurrency(data.amount)}</p>
        <p className="text-slate-400 text-[11px]">{formatPercentage(data.percentage)} of monthly expenses</p>
      </div>
    );
  }
  return null;
};

export const CategoryDonutChart = ({ categoryBreakdown }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    navigate(`/transactions?category=${encodeURIComponent(categoryName)}`);
  };

  const totalExpense = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Spending by Category</h3>
          <p className="text-xs text-slate-500">Breakdown of this month's expenses</p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          {formatCurrency(totalExpense)}
        </span>
      </div>

      {categoryBreakdown.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
          No expense transactions found for this period.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          {/* Donut Chart */}
          <div className="w-48 h-48 sm:w-52 sm:h-52 relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  onClick={(entry) => handleCategoryClick(entry.name)}
                  cursor="pointer"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCategoryColor(entry.name)}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <span className="text-xs font-bold text-slate-800">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>

          {/* Interactive Legend with click to filter transactions */}
          <div className="flex-1 w-full max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {categoryBreakdown.map((cat) => {
              const color = getCategoryColor(cat.name);
              return (
                <div
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                  title={`View all ${cat.name} transactions`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium text-slate-700 group-hover:text-teal-700 truncate">
                      {cat.name}
                    </span>
                  </div>
                  <div className="text-right flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-slate-900">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-[11px] text-slate-400 w-10 text-right">
                      {formatPercentage(cat.percentage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

