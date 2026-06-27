import type { AppUser, Project, ProjectContributor, StudentSkill, Submission, Task } from '@/types';

export type UserRole = 'founder' | 'student';

export type ApiUser = {
  id: string;
  external_auth_id: string | null;
  role: UserRole;
  name: string;
  email: string;
  image_url: string | null;
  created_at: string;
};

export type RepositoryId = Project['id'];

export type RepositoryTaskListResponse = {
  repository: Pick<Project, 'id' | 'repo_name' | 'repo_url' | 'repo_description' | 'tech_stack'>;
  tasks: Task[];
};

export type GenerateRepositoryTasksRequest = {
  count?: number;
  forceRegenerate?: boolean;
};

export type GenerateRepositoryTasksResponse = {
  repositoryId: RepositoryId;
  tasks: Task[];
  source: 'openai' | 'fallback' | 'existing';
  generated: boolean;
};

export type ApiErrorResponse = {
  error: string;
};


export type UpsertUserRequest = {
  external_auth_id?: string | null;
  role: UserRole;
  name: string;
  email: string;
  image_url?: string | null;
};

export type UpsertUserResponse = {
  user: AppUser;
};

export type StartContributionRequest = {
  student_id: string;
  status?: 'active' | 'completed' | 'removed';
};

export type StartContributionResponse = {
  contribution: ProjectContributor;
};

export type CreateSubmissionRequest = {
  task_id: string;
  student_id?: string | null;
  student_name?: string;
  student_email?: string | null;
  code: string;
  language?: string;
};

export type CreateSubmissionResponse = {
  submission: Submission;
};

export type SkillEvidenceRequest = {
  submission_id?: string | null;
  task_id?: string | null;
  skills: Array<{
    skill: string;
    score?: number;
    proficiency?: number;
    confidence?: number;
    evidence: string;
  }>;
};

export type SkillPassportResponse = {
  student: AppUser;
  skills: StudentSkill[];
};
