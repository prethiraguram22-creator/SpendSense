import React, { useState } from 'react';
import { X, Plus, PiggyBank } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const ContributionDialog = ({ isOpen, onClose, goal }) => {
  const { addGoalContribution } = useFinance();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !goal) return null;

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || isNaN(num) || num <= 0) {
      setError('Please enter a valid positive contribution');
      return;
    }
    addGoalContribution(goal.id, num);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-float max-w-sm w-full border border-slate-200 overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Contribution</h3>
              <p className="text-xs text-slate-500 truncate max-w-[180px]">{goal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Goal Target:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(goal.targetAmount)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Currently Saved:</span>
              <span className="font-semibold text-teal-700">
                {formatCurrency(goal.currentAmount)}
              </span>
            </div>

            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contribution Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="1000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white ${
                  error ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
              Quick Select
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setAmount(q.toString());
                    setError('');
                  }}
                  className="py-1 px-1.5 text-xs font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-lg border border-slate-200 transition-colors"
                >
                  +{formatCurrency(q)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Contribute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

