-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Projects: a founder's connected repository
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_description TEXT,
  repo_summary JSONB DEFAULT '{}'::jsonb,
  tech_stack TEXT[] DEFAULT '{}',
  architecture_overview TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks: AI-generated engineering tasks from a project
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  business_context TEXT,
  architecture_context TEXT,
  relevant_files TEXT[] DEFAULT '{}',
  acceptance_criteria TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tech_skills TEXT[] DEFAULT '{}',
  estimated_time TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Submissions: student code submissions for tasks
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT,
  code TEXT NOT NULL,
  language TEXT DEFAULT 'javascript',
  ai_review JSONB DEFAULT '{}'::jsonb,
  overall_score INTEGER DEFAULT 0,
  scores JSONB DEFAULT '{}'::jsonb,
  skills_assessed JSONB DEFAULT '[]'::jsonb,
  feedback TEXT,
  suggested_improvements TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (required by Supabase but we allow all for demo)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for demo (no auth)
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
