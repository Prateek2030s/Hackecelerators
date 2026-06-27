# Forge

AI-powered platform that transforms public GitHub repositories into structured engineering tasks for CS students.

**Where students build real software. Where startups discover real talent.**

## Tech Stack

- Next.js 15+ (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres)
- OpenAI (gpt-4o-mini)
- Monaco Editor + Octokit

## Quick Start

### 1. Install dependencies

```bash
cd forge
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and keys from Settings → API

### 3. Configure environment

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Flow

1. **Founder** → `/founder` → Connect a public GitHub repo → AI analyzes & generates 3 tasks
2. **Student** → `/student` → Pick a task → Write code in Monaco editor → Submit
3. **AI Review** → Animated score reveal with 6 category breakdowns
4. **Founder** → View ranked submissions on project detail page
5. **Student Profile** → `/student/profile` → Skill passport from submissions

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add all 4 environment variables
4. Deploy

## Hackathon

Built at Build 2026 Hackathon · #supcareer #build2026 #hackathon #PetaniAI
