import axios from 'axios';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Auto-inject Supabase JWT token on every request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    console.error('Error fetching Supabase session for API header:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle unauthorized responses (e.g. expired tokens)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access detected (401). Signing out...');
      await supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

export default api;
