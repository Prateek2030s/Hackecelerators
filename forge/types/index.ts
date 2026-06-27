export interface AppUser {
  id: string;
  external_auth_id: string | null;
  role: 'founder' | 'student';
  name: string;
  email: string;
  image_url: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  owner_id: string;
  company_name: string;
  description: string | null;
  created_at: string;
  owner?: AppUser;
}

export interface ProjectContributor {
  id: string;
  project_id: string;
  student_id: string;
  status: 'active' | 'completed' | 'removed';
  created_at: string;
  student?: AppUser;
  project?: Project;
}

export interface Project {
  id: string;
  founder_id: string | null;
  company_id: string | null;
  founder_name: string;
  repo_url: string;
  repo_name: string;
  repo_description: string | null;
  repo_summary: RepoSummary;
  tech_stack: string[];
  architecture_overview: string | null;
  status: 'active' | 'archived';
  created_at: string;
  founder?: AppUser;
  company?: Company;
  tasks?: Task[];
  task_count?: number;
  submission_count?: number;
}

export interface RepoSummary {
  summary: string;
  techStack: string[];
  architecture: string;
  businessContext: string;
  keyModules: { name: string; purpose: string; files: string[] }[];
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  business_context: string | null;
  architecture_context: string | null;
  relevant_files: string[];
  acceptance_criteria: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tech_skills: string[];
  estimated_time: string | null;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  project?: Project;
  submissions?: Submission[];
  submission_count?: number;
  average_score?: number;
}

export interface Submission {
  id: string;
  task_id: string;
  student_id: string | null;
  student_name: string;
  student_email: string | null;
  code: string;
  language: string;
  ai_review: AIReview;
  overall_score: number;
  scores: ReviewScores;
  skills_assessed: SkillAssessment[];
  feedback: string | null;
  suggested_improvements: string[];
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at: string;
  task?: Task;
  student?: AppUser;
}


export interface Skill {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
}

export interface StudentSkill {
  id: string;
  student_id: string;
  skill_id: string;
  score: number;
  confidence: number;
  evidence: string | null;
  assessment_count: number;
  last_assessed_at: string | null;
  created_at: string;
  updated_at: string;
  skill?: Skill;
  skills?: Skill;
  evidence_items?: SkillEvidence[];
  skill_evidence?: SkillEvidence[];
}

export interface SkillEvidence {
  id: string;
  student_skill_id: string;
  submission_id: string | null;
  task_id: string | null;
  score: number;
  confidence: number;
  evidence: string;
  created_at: string;
  submission?: Submission;
  task?: Task;
}

export interface AIReview {
  overallFeedback: string;
  passesThreshold: boolean;
}

export interface ReviewScores {
  correctness: { score: number; feedback: string };
  codeQuality: { score: number; feedback: string };
  security: { score: number; feedback: string };
  scalability: { score: number; feedback: string };
  businessLogic: { score: number; feedback: string };
  testing: { score: number; feedback: string };
}

export interface SkillAssessment {
  skill: string;
  proficiency: number;
  evidence: string;
}
