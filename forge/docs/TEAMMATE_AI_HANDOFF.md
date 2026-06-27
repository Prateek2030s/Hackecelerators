# Forge Teammate AI Handoff Instructions

Use this file as the prompt/context for AI agents working on the student task browser or profile/passport frontend. The backend contracts below are already implemented. Do not rename these endpoints without asking the project owner first.

## Current Product Flow

Forge lets founders generate apprenticeship tasks from a public GitHub repo, review the generated tasks, and upload the approved tasks into the stored task marketplace. Students should browse stored tasks, not task previews.

Important distinction:

- `/api/task-lab` is only for founder preview/generation testing.
- `/api/task-lab/confirm` stores a founder-approved preview into the real database.
- Student-facing pages should use `/api/tasks` and `/api/tasks/:taskId`.

## Auth/User Model

Users are stored in `app_users` after signup/login.

User shape:

~~~ts
type AppUser = {
  id: string;
  external_auth_id: string | null;
  role: 'founder' | 'student';
  name: string;
  email: string;
  image_url: string | null;
  created_at: string;
};
~~~

Use `app_users.id` as the stable frontend user id.

Auth pages already exist:

- `/auth/sign-up`
- `/auth/login`

Navbar is auth-aware and redirects by role:

- founder -> `/founder`
- student -> `/student`

## Student Task Browser Instructions

Build/update the student project/task browsing UI against stored tasks.

### List Tasks

Endpoint:

~~~http
GET /api/tasks
~~~

Optional filters:

~~~http
GET /api/tasks?difficulty=beginner
GET /api/tasks?difficulty=intermediate
GET /api/tasks?skill=React
~~~

Response:

~~~ts
type TasksResponse = {
  tasks: Task[];
};

type Task = {
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
  project?: {
    id: string;
    repo_name: string;
    repo_url: string;
    tech_stack: string[];
    founder_name: string;
  };
};
~~~

### Task Detail

Endpoint:

~~~http
GET /api/tasks/:taskId
~~~

Response:

~~~ts
type TaskDetailResponse = {
  task: Task & {
    project: Project;
    submissions: Submission[];
  };
};
~~~

### Start / Claim A Task

When a student starts a task, call:

~~~http
POST /api/tasks/:taskId/contributions
~~~

Body:

~~~json
{
  "student_id": "app_users.id",
  "status": "active"
}
~~~

Response:

~~~ts
type StartContributionResponse = {
  contribution: {
    id: string;
    project_id: string;
    student_id: string;
    status: 'active' | 'completed' | 'removed';
    created_at: string;
  };
};
~~~

### Submit Code

For MVP, code submission is pasted code.

Endpoint:

~~~http
POST /api/submissions
~~~

Body:

~~~json
{
  "task_id": "uuid",
  "student_id": "app_users.id",
  "code": "pasted code here",
  "language": "typescript"
}
~~~

Notes:

- `student_id` is preferred.
- Legacy `student_name` is still supported, but new UI should use `student_id`.
- A submission with `student_id` automatically creates/updates the project contributor record.

## Founder/Profile/Passport Page Instructions

Use these endpoints for profile pages, founder dashboards, and student passports.

### Get User Profile Bundle

Endpoint:

~~~http
GET /api/users/:userId
~~~

Response:

~~~ts
type UserDetailResponse = {
  user: AppUser;
  ownedProjects: Project[];
  contributions: ProjectContributor[];
  submissions: Submission[];
  skills: StudentSkill[];
};
~~~

Use this for founder profile created projects, student contributions/submissions, and account dashboard metadata.

### Student Skill Passport

Endpoint:

~~~http
GET /api/students/:studentId/skill-passport
~~~

Display suggestions:

- skill name
- score progress bar
- confidence percent
- latest evidence
- assessment count
- evidence history if there is space

### Add Skill Evidence Manually / Demo

Endpoint:

~~~http
POST /api/students/:studentId/skill-passport/evidence
~~~

Body:

~~~json
{
  "submission_id": "uuid-or-null",
  "task_id": "uuid-or-null",
  "skills": [
    {
      "skill": "React",
      "score": 82,
      "confidence": 76,
      "evidence": "Built a reusable component and handled loading states."
    }
  ]
}
~~~

Behavior:

- Creates skill if missing.
- Averages score/confidence into `student_skills`.
- Preserves each assessment in `skill_evidence`.

## Founder Task Upload Flow

This is already implemented in `/task-lab`.

Flow:

1. Founder enters GitHub repo URL.
2. `POST /api/task-lab` generates preview tasks.
3. Founder reviews task cards.
4. Founder clicks confirm.
5. `POST /api/task-lab/confirm` stores the project and tasks.
6. Stored tasks appear in `/api/tasks` for students.

Do not build student task browsing from `/api/task-lab`; use `/api/tasks`.

## Do Not Change Without Asking

Do not rename or change response contracts for:

- `GET /api/tasks`
- `GET /api/tasks/:taskId`
- `POST /api/tasks/:taskId/contributions`
- `POST /api/submissions`
- `GET /api/users/:userId`
- `GET /api/students/:studentId/skill-passport`
- `POST /api/students/:studentId/skill-passport/evidence`

## Hackathon Assumptions

- Auth exists and creates `app_users`.
- Route protection is intentionally light for hackathon speed.
- RLS policies are permissive for demo.
- `OPENAI_API_KEY` or `OPEN_API_KEY` powers AI generation/review.
- If OpenAI is missing, task preview has fallback demo tasks.

## Implementation Style

Keep UI consistent with the existing app:

- Next.js App Router
- React + TypeScript
- Existing shadcn-style components in `components/ui`
- Lucide icons
- Dark GitHub/Linear/Cursor-inspired SaaS aesthetic
- Use stored backend data; avoid hardcoded task lists except empty-state placeholders
