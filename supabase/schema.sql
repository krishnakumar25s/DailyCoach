-- DailyCoach Database Schema

-- Drop tables if they exist
DROP TABLE IF EXISTS public.deep_blocks;
DROP TABLE IF EXISTS public.focus_goals;
DROP TABLE IF EXISTS public.focus_logs;

-- 1. Focus Logs Table (One row per user per day)
CREATE TABLE public.focus_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sessions_count INTEGER NOT NULL CHECK (sessions_count >= 0 AND sessions_count <= 20),
    focus_minutes INTEGER NOT NULL CHECK (focus_minutes >= 0 AND focus_minutes <= 1440),
    energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 5),
    mit_done BOOLEAN NOT NULL DEFAULT FALSE,
    top_distraction VARCHAR(80),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- Unique constraint to enforce one log per user per date
    UNIQUE (user_id, date)
);

-- 2. Focus Goals Table (Weekly targets)
CREATE TABLE public.focus_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric VARCHAR(30) NOT NULL CHECK (metric IN ('focus_minutes', 'sessions', 'energy_avg', 'mit_streak')),
    target NUMERIC(8,2) NOT NULL,
    week DATE NOT NULL, -- Beginning of the week
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Deep Blocks Table (Planned work sessions)
CREATE TABLE public.deep_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    planned_for DATE NOT NULL,
    task VARCHAR(160) NOT NULL,
    target_minutes INTEGER NOT NULL CHECK (target_minutes >= 15 AND target_minutes <= 240),
    actual_minutes INTEGER CHECK (actual_minutes IS NULL OR (actual_minutes >= 0 AND actual_minutes <= 1440)),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.focus_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for focus_logs
CREATE POLICY "Users can select their own focus logs" 
    ON public.focus_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus logs" 
    ON public.focus_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus logs" 
    ON public.focus_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus logs" 
    ON public.focus_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for focus_goals
CREATE POLICY "Users can select their own focus goals" 
    ON public.focus_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus goals" 
    ON public.focus_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus goals" 
    ON public.focus_goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus goals" 
    ON public.focus_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for deep_blocks
CREATE POLICY "Users can select their own deep blocks" 
    ON public.deep_blocks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deep blocks" 
    ON public.deep_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deep blocks" 
    ON public.deep_blocks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deep blocks" 
    ON public.deep_blocks FOR DELETE USING (auth.uid() = user_id);

-- Performance optimization indexes
CREATE INDEX idx_focus_logs_user_date ON public.focus_logs(user_id, date DESC);
CREATE INDEX idx_goals_user ON public.focus_goals(user_id);
CREATE INDEX idx_blocks_user_date ON public.deep_blocks(user_id, planned_for);
