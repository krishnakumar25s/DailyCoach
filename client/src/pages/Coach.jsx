import React, { useState, useEffect } from 'react';
import api from '../api';
import { formatDate } from '../utils/format';
import { Sparkles, Loader2, Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

export default function Coach({ goals, onGoalSaved }) {
  // AI Coach Insights States
  const [insight, setInsight] = useState('');
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState('');

  // Weekly Goals Form States
  const [metric, setMetric] = useState('focus_minutes');
  const [target, setTarget] = useState('');
  const [week, setWeek] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editMetric, setEditMetric] = useState('focus_minutes');
  const [editTarget, setEditTarget] = useState('');
  const [editWeek, setEditWeek] = useState('');
  const [errorGoal, setErrorGoal] = useState('');

  // 1. Read cached AI coaching insight on component load
  useEffect(() => {
    try {
      const cached = localStorage.getItem('dailycoach_insight');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.insight) {
          setInsight(parsed.insight);
          setLastAnalyzed(new Date(parsed.timestamp));
        }
      }
    } catch (e) {
      console.warn('Failed to load cached AI coach insights:', e);
    }

    // Default target week to next Monday or current Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    setWeek(monday.toISOString().split('T')[0]);
  }, []);

  const handleAnalyze = async () => {
    setLoadingAI(true);
    setErrorAI('');
    try {
      const res = await api.post('/ai/analyze');
      const text = res.data.insight;
      const timestamp = new Date();
      
      setInsight(text);
      setLastAnalyzed(timestamp);
      
      // Cache in localStorage
      localStorage.setItem('dailycoach_insight', JSON.stringify({
        insight: text,
        timestamp: timestamp.toISOString()
      }));
    } catch (err) {
      setErrorAI(err.response?.data?.error || 'Failed to fetch AI insights. Please wait a minute before retrying.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!target || isNaN(target) || parseFloat(target) <= 0) {
      setErrorGoal('Please enter a positive numeric target.');
      return;
    }

    setSavingGoal(true);
    setErrorGoal('');
    try {
      await api.post('/goals', {
        metric,
        target: parseFloat(target),
        week
      });
      setTarget('');
      if (onGoalSaved) onGoalSaved();
    } catch (err) {
      setErrorGoal(err.response?.data?.error || 'Failed to save goal.');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleEditClick = (goal) => {
    setEditingGoalId(goal.id);
    setEditMetric(goal.metric);
    setEditTarget(goal.target);
    setEditWeek(goal.week);
  };

  const handleUpdateGoal = async (id) => {
    if (!editTarget || isNaN(editTarget) || parseFloat(editTarget) <= 0) {
      setErrorGoal('Please enter a positive numeric target.');
      return;
    }

    setErrorGoal('');
    try {
      await api.put(`/goals/${id}`, {
        metric: editMetric,
        target: parseFloat(editTarget),
        week: editWeek
      });
      setEditingGoalId(null);
      if (onGoalSaved) onGoalSaved();
    } catch (err) {
      setErrorGoal(err.response?.data?.error || 'Failed to update goal.');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Delete this goal row?')) {
      try {
        await api.delete(`/goals/${id}`);
        if (onGoalSaved) onGoalSaved();
      } catch (err) {
        console.error('Failed to delete goal:', err);
      }
    }
  };

  const formatMetricName = (name) => {
    switch (name) {
      case 'focus_minutes': return 'Focus Minutes';
      case 'sessions': return 'Focus Sessions';
      case 'energy_avg': return 'Avg Energy';
      case 'mit_streak': return 'MIT Streak';
      default: return name;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-dark">AI Coaching</h1>
        <p className="text-sm text-muted mt-1">Get customized feedback based on your last 7 focus entries, and plan your weekly targets.</p>
      </div>

      {/* 2. AI Coach Insight Card */}
      <div className="premium-card bg-gradient-to-br from-white via-white to-primary/5 border border-border-custom relative overflow-hidden p-6 space-y-4">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-text-dark uppercase tracking-wider">AI Focus Insights</h2>
              {lastAnalyzed && (
                <p className="text-[10px] text-muted font-medium mt-0.5">
                  Last analyzed: {lastAnalyzed.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loadingAI}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-primary/10 disabled:opacity-75"
          >
            {loadingAI ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{loadingAI ? 'Analyzing...' : 'Analyze My Week'}</span>
          </button>
        </div>

        {errorAI && (
          <div className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorAI}</span>
          </div>
        )}

        <div className="p-4.5 bg-bg-custom/40 border border-border-custom/55 rounded-xl min-h-24 flex items-center justify-center">
          {insight ? (
            <p className="text-sm leading-relaxed text-text-dark font-medium">{insight}</p>
          ) : (
            <p className="text-xs text-muted italic">Click "Analyze My Week" to generate productivity insights from your recent focus sessions.</p>
          )}
        </div>
      </div>

      {/* 3. Goals Manager Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-text-dark">Weekly Focus Goals</h2>
          <p className="text-xs text-muted">Set targets for focus duration, completed sessions, energy level, or task streaks.</p>
        </div>

        {errorGoal && (
          <div className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorGoal}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List existing Goals */}
          <div className="premium-card lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Current Goals</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-custom text-muted font-semibold">
                    <th className="py-2.5 px-2">Week (Mon)</th>
                    <th className="py-2.5 px-2">Metric</th>
                    <th className="py-2.5 px-2">Target</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((g) => (
                    <tr key={g.id} className="border-b border-border-custom/50 hover:bg-bg-custom/20 transition-colors">
                      {editingGoalId === g.id ? (
                        <>
                          <td className="py-2 px-2">
                            <input
                              type="date"
                              value={editWeek}
                              onChange={(e) => setEditWeek(e.target.value)}
                              className="px-2 py-1 border border-border-custom focus:border-primary rounded-lg text-xs outline-none"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={editMetric}
                              onChange={(e) => setEditMetric(e.target.value)}
                              className="px-2 py-1 border border-border-custom focus:border-primary rounded-lg text-xs outline-none"
                            >
                              <option value="focus_minutes">Focus Minutes</option>
                              <option value="sessions">Focus Sessions</option>
                              <option value="energy_avg">Avg Energy</option>
                              <option value="mit_streak">MIT Streak</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="any"
                              value={editTarget}
                              onChange={(e) => setEditTarget(e.target.value)}
                              className="w-20 px-2 py-1 border border-border-custom focus:border-primary rounded-lg text-xs outline-none"
                            />
                          </td>
                          <td className="py-2 px-2 text-right space-x-1">
                            <button
                              onClick={() => handleUpdateGoal(g.id)}
                              className="p-1 text-success hover:bg-success/10 rounded-md cursor-pointer inline-flex"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingGoalId(null)}
                              className="p-1 text-muted hover:bg-bg-custom rounded-md cursor-pointer inline-flex"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-2 font-semibold text-text-dark">{formatDate(g.week)}</td>
                          <td className="py-3 px-2 font-medium">{formatMetricName(g.metric)}</td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 bg-accent/40 text-primary font-bold rounded-md">
                              {g.target}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right space-x-1">
                            <button
                              onClick={() => handleEditClick(g)}
                              className="p-1.5 hover:bg-primary/10 text-muted hover:text-primary rounded-lg transition-all cursor-pointer inline-flex"
                              title="Edit goal"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(g.id)}
                              className="p-1.5 hover:bg-danger/10 text-muted hover:text-danger rounded-lg transition-all cursor-pointer inline-flex"
                              title="Delete goal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {goals.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-muted italic">
                        No weekly goals set. Use the form to establish targets.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Goal Sidebar Form */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Set Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-text-dark uppercase tracking-wider mb-1">Metric</label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary rounded-xl text-xs outline-none transition-all"
                >
                  <option value="focus_minutes">Focus Minutes</option>
                  <option value="sessions">Focus Sessions</option>
                  <option value="energy_avg">Average Energy (1-5)</option>
                  <option value="mit_streak">MIT Streak (Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-dark uppercase tracking-wider mb-1">Target Value</label>
                <input
                  type="number"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. 300, 5, 4.5"
                  className="w-full px-3 py-2 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary rounded-xl text-xs outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-dark uppercase tracking-wider mb-1">Week Commencing</label>
                <input
                  type="date"
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary rounded-xl text-xs outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingGoal || !target}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-primary/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{savingGoal ? 'Saving...' : 'Add Goal'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
