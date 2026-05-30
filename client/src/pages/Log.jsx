import React, { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, Brain, Award, Zap, AlertCircle, Save, CheckCircle } from 'lucide-react';

export default function Log({ logs, onLogSaved }) {
  // Local states for form inputs
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionsCount, setSessionsCount] = useState(4);
  const [focusMinutes, setFocusMinutes] = useState(100);
  const [energy, setEnergy] = useState(3);
  const [mitDone, setMitDone] = useState(false);
  const [topDistraction, setTopDistraction] = useState('');
  const [notes, setNotes] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If a log already exists for the selected date, prefill the values!
  useEffect(() => {
    const existingLog = logs.find(l => l.date === date);
    if (existingLog) {
      setSessionsCount(existingLog.sessions_count);
      setFocusMinutes(existingLog.focus_minutes);
      setEnergy(existingLog.energy);
      setMitDone(existingLog.mit_done);
      setTopDistraction(existingLog.top_distraction || '');
      setNotes(existingLog.notes || '');
    } else {
      // Default values
      setSessionsCount(4);
      setFocusMinutes(100);
      setEnergy(3);
      setMitDone(false);
      setTopDistraction('');
      setNotes('');
    }
  }, [date, logs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sessionsCount < 0 || sessionsCount > 20) {
      setErrorMsg('Sessions count must be between 0 and 20.');
      return;
    }
    if (focusMinutes < 0 || focusMinutes > 1440) {
      setErrorMsg('Focus minutes must be between 0 and 1440.');
      return;
    }
    if (energy < 1 || energy > 5) {
      setErrorMsg('Energy rating must be between 1 and 5.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/logs', {
        date,
        sessions_count: parseInt(sessionsCount),
        focus_minutes: parseInt(focusMinutes),
        energy: parseInt(energy),
        mit_done: mitDone,
        top_distraction: topDistraction.trim() || null,
        notes: notes.trim() || null
      });

      setSuccessMsg('Daily focus log saved successfully!');
      if (onLogSaved) {
        onLogSaved();
      }
      // Clear success toast after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save daily focus log.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-dark">Log Focus Session</h1>
        <p className="text-sm text-muted mt-1">Record your daily focus sessions and track distractions to train your focus muscle.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-2xl text-sm flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="premium-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Session Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all"
              required
            />
          </div>

          {/* Sessions Count */}
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1.5 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span>Completed Sessions (0 - 20)</span>
            </label>
            <input
              type="number"
              value={sessionsCount}
              min="0"
              max="20"
              onChange={(e) => setSessionsCount(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Focus Minutes */}
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1.5 flex items-center space-x-1">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span>Focus Minutes (0 - 1440)</span>
            </label>
            <input
              type="number"
              value={focusMinutes}
              min="0"
              max="1440"
              onChange={(e) => setFocusMinutes(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all"
              required
            />
          </div>

          {/* Energy Level (Premium Radio selection) */}
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-2.5 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Energy level (1 - 5)</span>
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergy(level)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    energy === level
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-bg-custom/50 text-text-dark border-border-custom hover:bg-bg-custom'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MIT Done Checkbox */}
        <div className="p-4 bg-bg-custom/40 border border-border-custom rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Award className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-text-dark">Most Important Task (MIT)</p>
              <p className="text-xs text-muted">Did you complete your primary objective for this day?</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={mitDone}
            onChange={(e) => setMitDone(e.target.checked)}
            className="w-5 h-5 text-primary focus:ring-primary border-border-custom rounded-md cursor-pointer"
          />
        </div>

        {/* Top Distraction */}
        <div>
          <label className="block text-xs font-semibold text-text-dark mb-1.5">Top Distraction</label>
          <input
            type="text"
            value={topDistraction}
            onChange={(e) => setTopDistraction(e.target.value)}
            placeholder="e.g. Phone notifications, Slack, Email browsing (max 80 chars)"
            maxLength={80}
            className="w-full px-4 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-text-dark mb-1.5">Session Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What went well? Where did you struggle?"
            rows="3"
            className="w-full px-4 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all resize-none"
          ></textarea>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-primary/10 disabled:opacity-75"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Log Entry'}</span>
        </button>
      </form>
    </div>
  );
}
