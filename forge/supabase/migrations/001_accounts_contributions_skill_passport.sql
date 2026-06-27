-- Add accounts, ownership, contribution, and skill passport storage.
-- Safe to run after the initial MVP schema has already created projects/tasks/submissions.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_auth_id TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('founder', 'student')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS founder_id UUID REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES app_users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS project_contributors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, student_id)
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  evidence TEXT,
  assessment_count INTEGER DEFAULT 0,
  last_assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, skill_id)
);

CREATE TABLE IF NOT EXISTS skill_evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_skill_id UUID REFERENCES student_skills(id) ON DELETE CASCADE NOT NULL,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  evidence TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_founder_id_idx ON projects(founder_id);
CREATE INDEX IF NOT EXISTS projects_company_id_idx ON projects(company_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS submissions_student_id_idx ON submissions(student_id);
CREATE INDEX IF NOT EXISTS project_contributors_project_id_idx ON project_contributors(project_id);
CREATE INDEX IF NOT EXISTS project_contributors_student_id_idx ON project_contributors(student_id);
CREATE INDEX IF NOT EXISTS student_skills_student_id_idx ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS student_skills_skill_id_idx ON student_skills(skill_id);
CREATE INDEX IF NOT EXISTS skill_evidence_student_skill_id_idx ON skill_evidence(student_skill_id);
CREATE INDEX IF NOT EXISTS skill_evidence_submission_id_idx ON skill_evidence(submission_id);
CREATE INDEX IF NOT EXISTS skill_evidence_task_id_idx ON skill_evidence(task_id);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_users' AND policyname = 'Allow all on app_users') THEN
    CREATE POLICY "Allow all on app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Allow all on companies') THEN
    CREATE POLICY "Allow all on companies" ON companies FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_contributors' AND policyname = 'Allow all on project_contributors') THEN
    CREATE POLICY "Allow all on project_contributors" ON project_contributors FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'skills' AND policyname = 'Allow all on skills') THEN
    CREATE POLICY "Allow all on skills" ON skills FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'student_skills' AND policyname = 'Allow all on student_skills') THEN
    CREATE POLICY "Allow all on student_skills" ON student_skills FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'skill_evidence' AND policyname = 'Allow all on skill_evidence') THEN
    CREATE POLICY "Allow all on skill_evidence" ON skill_evidence FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
