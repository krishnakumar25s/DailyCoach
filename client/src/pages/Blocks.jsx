import React, { useState } from 'react';
import api from '../api';
import { formatDate, formatMinutes } from '../utils/format';
import { Clock, Plus, Check, Loader2, Calendar, AlertCircle } from 'lucide-react';

export default function Blocks({ blocks, onBlockSaved }) {
  const [task, setTask] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [plannedFor, setPlannedFor] = useState(new Date().toISOString().split('T')[0]);
  const [adding, setAdding] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [actualMinutesInput, setActualMinutesInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Format helper to split blocks into Today and Tomorrow
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayBlocks = blocks.filter(b => b.planned_for === todayStr);
  const tomorrowBlocks = blocks.filter(b => b.planned_for === tomorrowStr);
  const otherBlocks = blocks.filter(b => b.planned_for !== todayStr && b.planned_for !== tomorrowStr);

  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    
    setAdding(true);
    setErrorMsg('');
    try {
      await api.post('/blocks', {
        task: task.trim(),
        target_minutes: parseInt(targetMinutes),
        planned_for: plannedFor
      });
      setTask('');
      if (onBlockSaved) onBlockSaved();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to add deep-work block.');
    } finally {
      setAdding(false);
    }
  };

  const handleCompleteBlock = async (id, target) => {
    // If not already prompted, open form input inline
    if (completingId !== id) {
      setCompletingId(id);
      setActualMinutesInput(target.toString());
      return;
    }

    const minutes = parseInt(actualMinutesInput);
    if (isNaN(minutes) || minutes < 0 || minutes > 1440) {
      setErrorMsg('Actual focus minutes must be between 0 and 1440.');
      return;
    }

    setErrorMsg('');
    try {
      await api.put(`/blocks/${id}`, {
        completed: true,
        actual_minutes: minutes
      });
      setCompletingId(null);
      if (onBlockSaved) onBlockSaved();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to complete block.');
    }
  };

  const renderBlockList = (blockList, title) => {
    if (blockList.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider">{title}</h3>
        <div className="space-y-2">
          {blockList.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white ${
                b.completed ? 'border-success/20 bg-success/5' : 'border-border-custom'
              }`}
            >
              <div>
                <p className={`text-sm font-semibold text-text-dark ${b.completed ? 'line-through text-muted' : ''}`}>
                  {b.task}
                </p>
                <div className="flex items-center space-x-2 text-xs text-muted mt-0.5">
                  <span className="flex items-center space-x-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Target: {formatMinutes(b.target_minutes)}</span>
                  </span>
                  {b.completed && (
                    <span className="text-success font-medium">
                      • Logged: {formatMinutes(b.actual_minutes)}
                    </span>
                  )}
                  {!b.completed && b.planned_for !== todayStr && b.planned_for !== tomorrowStr && (
                    <span>• {formatDate(b.planned_for)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!b.completed && completingId === b.id && (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      value={actualMinutesInput}
                      onChange={(e) => setActualMinutesInput(e.target.value)}
                      placeholder="Mins"
                      className="w-16 px-2 py-1 border border-border-custom focus:border-primary rounded-md text-xs outline-none"
                    />
                    <span className="text-xs text-muted">mins</span>
                  </div>
                )}

                {!b.completed ? (
                  <button
                    onClick={() => handleCompleteBlock(b.id, b.target_minutes)}
                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{completingId === b.id ? 'Save' : 'Complete'}</span>
                  </button>
                ) : (
                  <span className="px-2 py-0.5 bg-success/15 text-success rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center space-x-0.5">
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </span>
                )}

                {completingId === b.id && (
                  <button
                    onClick={() => setCompletingId(null)}
                    className="px-2 py-1.5 text-xs font-semibold hover:bg-bg-custom rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Blocks Area */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-dark">Deep-Work Blocks</h1>
          <p className="text-sm text-muted mt-1">Designate sessions for high-focus work. Avoid multitasking by planning blocks beforehand.</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-6">
          {todayBlocks.length === 0 && tomorrowBlocks.length === 0 && otherBlocks.length === 0 ? (
            <div className="premium-card p-12 text-center text-muted">
              <Clock className="w-12 h-12 mx-auto text-muted/30 mb-3" />
              <p className="text-sm font-semibold">No planned deep work blocks yet.</p>
              <p className="text-xs mt-1">Use the sidebar form to schedule your first block.</p>
            </div>
          ) : (
            <>
              {renderBlockList(todayBlocks, 'Today')}
              {renderBlockList(tomorrowBlocks, 'Tomorrow')}
              {renderBlockList(otherBlocks, 'Upcoming & Past')}
            </>
          )}
        </div>
      </div>

      {/* Add Block Form Area */}
      <div>
        <div className="premium-card space-y-5 lg:sticky lg:top-6">
          <h2 className="text-sm font-bold text-text-dark uppercase tracking-wider">Plan Work Block</h2>
          <form onSubmit={handleAddBlock} className="space-y-4">
            {/* Task Name */}
            <div>
              <label className="block text-xs font-semibold text-text-dark mb-1">Task / Focus Goal</label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. Design database, Write copy"
                maxLength={160}
                className="w-full px-4.5 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all"
                required
              />
            </div>

            {/* Target Minutes */}
            <div>
              <label className="block text-xs font-semibold text-text-dark mb-1">Target Duration</label>
              <select
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(parseInt(e.target.value))}
                className="w-full px-4.5 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary rounded-xl text-sm outline-none transition-all"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">1 Hour (60m)</option>
                <option value="90">1.5 Hours (90m)</option>
                <option value="120">2 Hours (120m)</option>
                <option value="180">3 Hours (180m)</option>
                <option value="240">4 Hours (240m)</option>
              </select>
            </div>

            {/* Planned For Date */}
            <div>
              <label className="block text-xs font-semibold text-text-dark mb-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-primary" />
                <span>Planned For</span>
              </label>
              <input
                type="date"
                value={plannedFor}
                onChange={(e) => setPlannedFor(e.target.value)}
                className="w-full px-4.5 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={adding || !task.trim()}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-primary/10 disabled:opacity-75"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Plan Block</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
