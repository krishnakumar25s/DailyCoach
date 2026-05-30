import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import api from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Log from './pages/Log';
import Blocks from './pages/Blocks';
import Coach from './pages/Coach';
import { 
  LayoutDashboard, CalendarRange, FilePlus2, Sparkles, 
  LogOut, User, Bell, HelpCircle, Search, Menu, X, Loader2
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Shared global state
  const [logs, setLogs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [blocks, setBlocks] = useState([]);

  // 1. Listen to Supabase authentication state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // Reset state on logout
        setLogs([]);
        setGoals([]);
        setBlocks([]);
        localStorage.removeItem('dailycoach_insight');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch all data in parallel on successful login or refresh
  const fetchData = async () => {
    if (!session) return;
    try {
      const [logsRes, goalsRes, blocksRes] = await Promise.all([
        api.get('/logs'),
        api.get('/goals'),
        api.get('/blocks')
      ]);
      setLogs(logsRes.data || []);
      setGoals(goalsRes.data || []);
      setBlocks(blocksRes.data || []);
    } catch (err) {
      console.error('Failed to sync application data with backend:', err);
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await supabase.auth.signOut();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-custom">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-semibold text-muted">Securing session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  // User initials for profile chip
  const userEmail = session.user?.email || '';
  const userInitials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'blocks', label: 'Deep Blocks', icon: CalendarRange },
    { id: 'log', label: 'Log Session', icon: FilePlus2 },
    { id: 'coach', label: 'AI Coach', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen flex bg-bg-custom text-text-dark font-sans">
      {/* A. DESKTOP SIDEBAR NAV (264px) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-66 bg-white border-r border-border-custom flex flex-col justify-between p-6 transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="space-y-8">
          {/* Logo Branding */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md shadow-primary/20">
                F
              </span>
              <div>
                <h1 className="font-bold text-base leading-tight tracking-tight">DailyCoach</h1>
                <p className="text-[10px] text-muted font-medium">Build the focus habit</p>
              </div>
            </div>
            {/* Close button for mobile sidebar */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-bg-custom rounded-lg md:hidden cursor-pointer"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-accent text-primary' 
                      : 'text-muted hover:bg-bg-custom/50 hover:text-text-dark'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer actions: User Profile & Log Out */}
        <div className="border-t border-border-custom pt-5 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-dark truncate">{userEmail}</p>
              <p className="text-[10px] text-muted">User Space</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs font-bold text-muted hover:text-danger hover:bg-danger/5 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs md:hidden"
        ></div>
      )}

      {/* B. MAIN CONTENT FRAME */}
      <div className="flex-1 md:pl-66 min-w-0 flex flex-col">
        {/* Top Header bar */}
        <header className="sticky top-0 z-20 bg-bg-custom/80 backdrop-blur-md border-b border-border-custom/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-white rounded-lg md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5 text-muted" />
            </button>
            
            {/* Search Mock Input */}
            <div className="relative hidden sm:block w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search logs or goals..."
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-border-custom rounded-xl text-xs outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-white text-muted hover:text-text-dark rounded-xl transition-all cursor-pointer relative" title="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-white text-muted hover:text-text-dark rounded-xl transition-all cursor-pointer" title="Help & Docs">
              <HelpCircle className="w-4 h-4" />
            </button>
            <div className="h-6 w-[1px] bg-border-custom/80"></div>
            <div className="px-2.5 py-1 bg-white border border-border-custom rounded-xl text-[10px] font-bold text-muted flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{userEmail}</span>
            </div>
          </div>
        </header>

        {/* Tab Pages rendering */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard logs={logs} onLogDeleted={fetchData} />}
          {activeTab === 'log' && <Log logs={logs} onLogSaved={fetchData} />}
          {activeTab === 'blocks' && <Blocks blocks={blocks} onBlockSaved={fetchData} />}
          {activeTab === 'coach' && <Coach goals={goals} onGoalSaved={fetchData} />}
        </main>
      </div>
    </div>
  );
}
