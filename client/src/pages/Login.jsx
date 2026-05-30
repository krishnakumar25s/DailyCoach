import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { KeyRound, Mail, Sparkles, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Registration successful! Please check your email for confirmation (if enabled) or proceed to sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-custom px-4 select-none">
      <div className="max-w-md w-full premium-card p-8 flex flex-col space-y-6 bg-white border border-border-custom shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-dark">DailyCoach</h1>
          <p className="text-sm text-muted mt-1">Build the deep-work focus habit</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-success/10 border border-success/20 text-success rounded-xl text-xs font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-dark mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-bg-custom/50 focus:bg-white border border-border-custom focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl text-sm flex items-center justify-center space-x-2 transition-all duration-200 shadow-md shadow-primary/10 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="text-center border-t border-border-custom/50 pt-4">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
