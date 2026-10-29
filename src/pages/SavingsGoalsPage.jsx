import React, { useState, useMemo } from 'react';
import {
  Plus,
  PiggyBank,
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  Edit2,
  Trash2,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters';
import { SavingsGoalDialog } from '../components/savings/SavingsGoalDialog';
import { ContributionDialog } from '../components/savings/ContributionDialog';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

export const SavingsGoalsPage = () => {
  const { goalsWithCalculations, deleteSavingsGoal } = useFinance();

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [deletingGoalId, setDeletingGoalId] = useState(null);

  // Overall summary
  const summary = useMemo(() => {
    const totalSaved = goalsWithCalculations.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goalsWithCalculations.reduce((sum, g) => sum + g.targetAmount, 0);
    const completed = goalsWithCalculations.filter((g) => g.status === 'completed').length;
    const active = goalsWithCalculations.length - completed;
    const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    return {
      totalSaved,
      totalTarget,
      completed,
      active,
      overallProgress,
    };
  }, [goalsWithCalculations]);

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setIsGoalDialogOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoal(goal);
    setIsGoalDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingGoalId) {
      deleteSavingsGoal(deletingGoalId);
      setDeletingGoalId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Savings Goals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Turn your financial dreams into calculated, achievable monthly milestones.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-card transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saved */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Total Saved Toward Goals
          </span>
          <p className="text-2xl font-bold text-teal-700">
            {formatCurrency(summary.totalSaved)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {summary.overallProgress}% of target funded
          </p>
        </div>

        {/* Total Target */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Total Target Amount
          </span>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.totalTarget)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Across all milestone buckets</p>
        </div>

        {/* Active Goals */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Active Goals
          </span>
          <p className="text-2xl font-bold text-slate-900">
            {summary.active}
          </p>
          <p className="text-xs text-slate-400 mt-1">Currently in progress</p>
        </div>

        {/* Completed Goals */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Completed Goals
          </span>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-bold text-green-700">
              {summary.completed}
            </p>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              Milestone Reached
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Great job!</p>
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goalsWithCalculations.map((g) => {
          const isCompleted = g.status === 'completed';
          const isAtRisk = g.status === 'at_risk';

          let statusBadge = {
            label: 'On Track',
            bg: 'bg-green-50 text-green-700 border-green-200',
            barColor: 'bg-teal-600',
          };

          if (isCompleted) {
            statusBadge = {
              label: 'Completed',
              bg: 'bg-teal-100 text-teal-800 border-teal-300 font-bold',
              barColor: 'bg-teal-700',
            };
          } else if (isAtRisk) {
            statusBadge = {
              label: 'Target Date Passed',
              bg: 'bg-red-50 text-red-700 border-red-200',
              barColor: 'bg-red-500',
            };
          }

          return (
            <div
              key={g.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{g.name}</h4>
                      <span className="text-xs text-slate-400">{g.category || 'General'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-slate-100 transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingGoalId(g.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {g.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {g.description}
                  </p>
                )}

                {/* Financial Progress */}
                <div className="my-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div>
                      <span className="text-xs text-slate-400 block">Saved</span>
                      <span className="text-xl font-bold text-teal-700">
                        {formatCurrency(g.currentAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Target</span>
                      <span className="text-base font-semibold text-slate-700">
                        {formatCurrency(g.targetAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{formatPercentage(g.progress)}</span>
                      <span>
                        {isCompleted
                          ? 'Goal Met!'
                          : `${formatCurrency(g.remainingAmount)} remaining`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusBadge.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, g.progress)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Target Date & Status */}
                <div className="flex items-center justify-between py-2 border-y border-slate-100 text-xs text-slate-500 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target: {formatDate(g.targetDate, 'short')}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] border ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* Monthly Required Contribution Calculation */}
                {!isCompleted && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                        <span>Monthly target deposit:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(g.monthlyContributionRequired)}/mo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Calculated from remaining funds divided by months until {formatDate(g.targetDate, 'short')}.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button: Add Contribution */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setContributingGoal(g)}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100/80 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contribution</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Create/Edit Dialog */}
      <SavingsGoalDialog
        isOpen={isGoalDialogOpen}
        onClose={() => setIsGoalDialogOpen(false)}
        initialGoal={editingGoal}
      />

      {/* Contribution Dialog */}
      <ContributionDialog
        isOpen={Boolean(contributingGoal)}
        onClose={() => setContributingGoal(null)}
        goal={contributingGoal}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(deletingGoalId)}
        title="Delete Savings Goal"
        message="Are you sure you want to remove this savings goal? This will not alter any transactions."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingGoalId(null)}
      />
    </div>
  );
};
