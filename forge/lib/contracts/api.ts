import type { Project, Task } from '@/types';

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
