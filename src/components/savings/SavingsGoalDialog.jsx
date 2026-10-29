import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const SavingsGoalDialog = ({
  isOpen,
  onClose,
  initialGoal = null,
}) => {
  const { addSavingsGoal, updateSavingsGoal } = useFinance();

  const isEdit = Boolean(initialGoal?.id);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialGoal) {
      setName(initialGoal.name || '');
      setTargetAmount(initialGoal.targetAmount?.toString() || '');
      setCurrentAmount(initialGoal.currentAmount?.toString() || '0');
      setTargetDate(initialGoal.targetDate || '');
      setCategory(initialGoal.category || 'Personal');
      setDescription(initialGoal.description || '');
      setErrors({});
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      // Default target date 6 months in future
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      setTargetDate(d.toISOString().slice(0, 10));
      setCategory('Personal');
      setDescription('');
      setErrors({});
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Goal name is required';
    const targetNum = parseFloat(targetAmount);
    if (!targetAmount || isNaN(targetNum) || targetNum <= 0) {
      errs.targetAmount = 'Enter a valid target amount';
    }
    const currentNum = parseFloat(currentAmount);
    if (isNaN(currentNum) || currentNum < 0) {
      errs.currentAmount = 'Current amount cannot be negative';
    }
    if (!targetDate) {
      errs.targetDate = 'Target date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount || 0),
      targetDate,
      category,
      description: description.trim(),
    };

    if (isEdit) {
      updateSavingsGoal(initialGoal.id, payload);
    } else {
      addSavingsGoal(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-float max-w-md w-full border border-slate-200 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Edit Savings Goal' : 'Create Savings Goal'}
            </h3>
            <p className="text-xs text-slate-500">
              Set milestones for what matters to you
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Emergency Fund, New Laptop, Goa Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all ${
                errors.name ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="20000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white ${
                  errors.targetAmount ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.targetAmount && (
                <p className="text-[11px] text-red-600 mt-1">{errors.targetAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Initial Saved (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Date *
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  errors.targetDate ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.targetDate && (
                <p className="text-[11px] text-red-600 mt-1">{errors.targetDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="Emergency">Emergency</option>
                <option value="Tech">Tech / Gadgets</option>
                <option value="Travel">Travel / Vacation</option>
                <option value="Education">Education</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Why this goal matters..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors"
            >
              {isEdit ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

