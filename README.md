# DailyCoach — AI-Coached Deep Work Tracker

DailyCoach is a full-stack deep-work productivity tracker. It enables you to log daily focus metrics (session counts, focus minutes, energy levels, distractions, MIT completion), schedule deep work blocks, and receive data-driven coaching insights powered by Claude.

---

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS v4 + Recharts + Lucide Icons + Axios
- **Backend**: Python 3.11+ with FastAPI + Uvicorn + Pydantic v2 + python-dotenv + SlowAPI rate limiter
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security & email/password auth)
- **AI Integration**: Anthropic Claude API (model `claude-3-5-sonnet-20241022` or latest) with local rules-based fallback

---

## Folder Structure
```
dailycoach/
├── package.json                       # root: "install-all" + "dev" via concurrently
├── README.md
├── .gitignore
├── client/
│   ├── .env.example
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                    # session + tab routing + shared state
│       ├── api.js                     # axios w/ JWT interceptor
│       ├── supabaseClient.js
│       ├── index.css                  # Tailwind v4 imports + design tokens
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Log.jsx
│       │   ├── Blocks.jsx             # plan tomorrow's deep work blocks
│       │   └── Coach.jsx
│       └── utils/
│           └── format.js
└── server/
    ├── .env.example
    ├── requirements.txt
    ├── main.py                        # FastAPI app, CORS, rate limits, router mounts
    ├── auth.py                        # JWT verification dependency
    ├── routers/
    │   ├── logs.py
    │   ├── goals.py
    │   ├── blocks.py
    │   └── ai.py
    ├── services/
    │   └── claude_service.py
    ├── schemas/                       # Pydantic models
    │   ├── log.py
    │   ├── goal.py
    │   └── block.py
    └── db/
        └── supabase_client.py
└── supabase/
    └── schema.sql
```

---

## Getting Started

### 1. Database Setup
1. Create a project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of [supabase/schema.sql](file:///c:/Users/krish/OneDrive/Documents/Rainmeter/proj/personal_track/supabase/schema.sql) and click **Run**. This will create the `focus_logs`, `focus_goals`, and `deep_blocks` tables with Row Level Security (RLS) policies configured.

### 2. Environment Variables Configuration

#### Client Configuration
Configure [client/.env](file:///c:/Users/krish/OneDrive/Documents/Rainmeter/proj/personal_track/client/.env):
```env
VITE_SUPABASE_URL=https://your-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000/api
```

#### Server Configuration
Configure [server/.env](file:///c:/Users/krish/OneDrive/Documents/Rainmeter/proj/personal_track/server/.env):
```env
PORT=5000
SUPABASE_URL=https://your-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-key-here
CLIENT_URL=http://localhost:5173
```
> **Note**: If `ANTHROPIC_API_KEY` is left blank, DailyCoach will automatically fall back to a local, rules-based mock focus analyzer so you can fully test the app without spending API credits.

### 3. Install & Run
Run these commands from the root directory:
```bash
# Install client node_modules and setup python virtual environment + requirements
npm run install-all

# Start both client (Vite) and server (FastAPI) concurrently
npm run dev
```

---

## AI Coach Prompting
When you click **Analyze My Week** in the AI Coach tab, DailyCoach sends the user's last 7 days of logs to Claude with the following prompt:
```
You are DailyCoach, a deep-work productivity analyst.

User's last 7 days of focus logs:
[JSON array of 7 logs]

Respond with:
1. One focus-killing pattern you notice (cite the data).
2. How energy level correlates with focus minutes and MIT completion.
3. The single highest-leverage scheduling change for tomorrow.

Be direct, data-specific, and concrete. Max 4 sentences. No fluff, no preamble.
```
