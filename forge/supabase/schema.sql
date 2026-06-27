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


-- Account contract additions: stable ids for founder and student profile work
CREATE TABLE app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_auth_id TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('founder', 'student')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS founder_id UUID REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE TABLE project_contributors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, student_id)
);

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES app_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_founder_id_idx ON projects(founder_id);
CREATE INDEX IF NOT EXISTS projects_company_id_idx ON projects(company_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS submissions_student_id_idx ON submissions(student_id);
CREATE INDEX IF NOT EXISTS project_contributors_project_id_idx ON project_contributors(project_id);
CREATE INDEX IF NOT EXISTS project_contributors_student_id_idx ON project_contributors(student_id);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on project_contributors" ON project_contributors FOR ALL USING (true) WITH CHECK (true);
