import React, { useMemo } from 'react';
import api from '../api';
import { formatDate, formatMinutes } from '../utils/format';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, CartesianGrid
} from 'recharts';
import { Clock, Zap, Award, Flame, FlameKindling, Trash2, ShieldAlert } from 'lucide-react';

export default function Dashboard({ logs, onLogDeleted }) {
  // 1. Sort logs by date descending for computations
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs]);

  // 2. Fetch last 7 logs for weekly metrics
  const last7Logs = useMemo(() => {
    return sortedLogs.slice(0, 7);
  }, [sortedLogs]);

  // 3. Compute KPI metrics
  const kpis = useMemo(() => {
    if (last7Logs.length === 0) {
      return { totalMinutes: 0, avgEnergy: 0, mitRate: 0, mitStreak: 0 };
    }

    const totalMinutes = last7Logs.reduce((sum, l) => sum + (l.focus_minutes || 0), 0);
    const totalEnergy = last7Logs.reduce((sum, l) => sum + (l.energy || 0), 0);
    const avgEnergy = (totalEnergy / last7Logs.length).toFixed(1);
    
    const mitDoneCount = last7Logs.filter(l => l.mit_done).length;
    const mitRate = Math.round((mitDoneCount / last7Logs.length) * 100);

    // Compute MIT streak (consecutive days with mit_done: true, starting from most recent)
    let mitStreak = 0;
    for (let i = 0; i < sortedLogs.length; i++) {
      if (sortedLogs[i].mit_done) {
        mitStreak++;
      } else {
        break;
      }
    }

    return { totalMinutes, avgEnergy, mitRate, mitStreak };
  }, [last7Logs, sortedLogs]);

  // 4. Compute Top Distractions
  const topDistractions = useMemo(() => {
    const counts = {};
    logs.forEach(l => {
      if (l.top_distraction) {
        const item = l.top_distraction.trim();
        counts[item] = (counts[item] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [logs]);

  // 5. Prepare chart data (Chronological order)
  const barChartData = useMemo(() => {
    return [...last7Logs].reverse().map(l => ({
      date: l.date.split('-').slice(1).join('/'), // format as MM/DD
      Minutes: l.focus_minutes,
      Sessions: l.sessions_count
    }));
  }, [last7Logs]);

  const scatterChartData = useMemo(() => {
    return logs.map(l => ({
      Energy: l.energy,
      Minutes: l.focus_minutes,
      name: l.date
    }));
  }, [logs]);

  const handleDeleteLog = async (id) => {
    if (window.confirm('Are you sure you want to delete this focus log?')) {
      try {
        await api.delete(`/logs/${id}`);
        if (onLogDeleted) onLogDeleted();
      } catch (err) {
        console.error('Failed to delete focus log:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-dark">Dashboard</h1>
        <p className="text-sm text-muted mt-1">Review your weekly stats, energy alignment, and distraction analytics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Focus Minutes */}
        <div className="premium-card flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Weekly Focus Time</p>
            <p className="text-2xl font-bold text-text-dark">{formatMinutes(kpis.totalMinutes)}</p>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Average Energy Level */}
        <div className="premium-card flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Avg Energy Level</p>
            <p className="text-2xl font-bold text-text-dark">{kpis.avgEnergy}/5.0</p>
          </div>
          <div className="p-3 bg-warning/15 text-warning rounded-xl">
            <Zap className="w-5 h-5 fill-warning/20" />
          </div>
        </div>

        {/* MIT Completion Rate */}
        <div className="premium-card flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">MIT Completion</p>
            <p className="text-2xl font-bold text-text-dark">{kpis.mitRate}%</p>
          </div>
          <div className="p-3 bg-success/15 text-success rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Current MIT Streak */}
        <div className="premium-card flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Current MIT Streak</p>
            <p className="text-2xl font-bold text-text-dark">
              {kpis.mitStreak} {kpis.mitStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${kpis.mitStreak > 0 ? 'bg-danger/10 text-danger' : 'bg-muted/10 text-muted'}`}>
            <Flame className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Daily Focus Minutes */}
        <div className="premium-card lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-text-dark uppercase tracking-wider">Daily Focus Minutes</h2>
            <p className="text-xs text-muted">Focus sessions logged over the last 7 entries.</p>
          </div>
          <div className="h-64">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} 
                    labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="Minutes" fill="#3b5bdb" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                No session data logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Distraction Tallies & Energy Correlation */}
        <div className="premium-card space-y-5">
          <div>
            <h2 className="text-sm font-bold text-text-dark uppercase tracking-wider">Top 3 Distractions</h2>
            <p className="text-xs text-muted">Most common focus-blockers logged.</p>
          </div>
          <div className="space-y-3">
            {topDistractions.length > 0 ? (
              topDistractions.map((d, index) => (
                <div key={d.name} className="flex items-center justify-between p-3 bg-bg-custom/40 border border-border-custom rounded-xl">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-text-dark truncate max-w-[130px]">{d.name}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-accent/40 text-primary rounded-md text-[10px] font-bold">
                    {d.count} {d.count === 1 ? 'time' : 'times'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted flex flex-col items-center">
                <ShieldAlert className="w-8 h-8 text-muted/30 mb-2" />
                <span>No distractions recorded yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Energy vs Focus Scatter Chart */}
      <div className="premium-card space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text-dark uppercase tracking-wider">Energy & Focus Correlation</h2>
          <p className="text-xs text-muted">Visualizing how your daily energy level correlates with focus minutes.</p>
        </div>
        <div className="h-64">
          {scatterChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  dataKey="Energy" 
                  name="Energy" 
                  unit="/5" 
                  domain={[0, 6]} 
                  ticks={[1, 2, 3, 4, 5]}
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  type="number" 
                  dataKey="Minutes" 
                  name="Focus Minutes" 
                  unit="m" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  labelStyle={{ display: 'none' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Scatter name="Logs" data={scatterChartData} fill="#3b5bdb" line={false} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted">
              Add multiple logs to chart focus/energy correlation.
            </div>
          )}
        </div>
      </div>

      {/* Recent Logs Table */}
      <div className="premium-card space-y-4">
        <div>
          <h2 className="text-sm font-bold text-text-dark uppercase tracking-wider">Recent Activity</h2>
          <p className="text-xs text-muted">Your last 7 focus entries.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-custom text-muted font-semibold">
                <th className="py-3 px-2">Date</th>
                <th className="py-3 px-2">Sessions</th>
                <th className="py-3 px-2">Focus Time</th>
                <th className="py-3 px-2">Energy</th>
                <th className="py-3 px-2">MIT Done</th>
                <th className="py-3 px-2">Distraction</th>
                <th className="py-3 px-2">Notes</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.slice(0, 7).map((log) => (
                <tr key={log.id} className="border-b border-border-custom/50 hover:bg-bg-custom/30 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-text-dark">{formatDate(log.date)}</td>
                  <td className="py-3.5 px-2">{log.sessions_count}</td>
                  <td className="py-3.5 px-2 font-medium">{formatMinutes(log.focus_minutes)}</td>
                  <td className="py-3.5 px-2">
                    <span className="px-2 py-0.5 bg-warning/10 text-warning font-bold rounded-md">
                      {log.energy}/5
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                      log.mit_done ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'
                    }`}>
                      {log.mit_done ? 'Completed' : 'No'}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-muted max-w-[120px] truncate">{log.top_distraction || '-'}</td>
                  <td className="py-3.5 px-2 text-muted max-w-[150px] truncate">{log.notes || '-'}</td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 hover:bg-danger/10 text-muted hover:text-danger rounded-lg transition-all cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedLogs.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-muted">
                    No activity logs recorded yet. Start by logging your day!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
