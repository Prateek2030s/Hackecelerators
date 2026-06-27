# Forge API Contract

This contract keeps founder, student, and AI workflow work consistent while the UI is split across teammates.

## MVP Entity Mapping

For the current MVP, a connected repository is stored in the existing `projects` table.

- `repositoryId` in API routes equals `projects.id` in the database.
- Generated tasks are stored in `tasks.project_id`.
- Student submissions are stored in `submissions.task_id`.
- Account/profile work should use `app_users.id` as the stable internal user id once auth is connected.

This avoids breaking the current founder/student screens while giving the API repository-oriented names.

## Roles

`app_users.role` is one of:

- `founder`
- `student`

Founder ownership:

- `projects.founder_id -> app_users.id`
- legacy demo field `projects.founder_name` remains supported.

Student contribution:

- `project_contributors.student_id -> app_users.id`
- `submissions.student_id -> app_users.id`
- legacy demo fields `submissions.student_name` and `submissions.student_email` remain supported.

## Repository Task APIs

### List Stored Tasks

`GET /api/repositories/:repositoryId/tasks`

Response:

~~~json
{
  "repository": {
    "id": "uuid",
    "repo_name": "repo-name",
    "repo_url": "https://github.com/owner/repo"
  },
  "tasks": []
}
~~~

### Generate And Store Tasks

`POST /api/repositories/:repositoryId/tasks/generate`

Request:

~~~json
{
  "count": 3,
  "forceRegenerate": false
}
~~~

Behavior:

- If stored tasks already exist and `forceRegenerate` is false, returns the existing tasks.
- If no tasks exist, generates simple tasks from the stored repository summary and inserts them.
- If `OPENAI_API_KEY` is missing, inserts deterministic fallback tasks so the demo remains usable.
- If `forceRegenerate` is true, deletes existing tasks for that repository and inserts a fresh batch.

Response:

~~~json
{
  "repositoryId": "uuid",
  "tasks": [],
  "source": "openai | fallback | existing",
  "generated": true
}
~~~

## Shared Task Shape

Frontend code should expect task objects in the database shape:

~~~ts
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
};
~~~


## Account APIs

### Upsert User

`POST /api/users`

~~~json
{
  "external_auth_id": "clerk-user-id-or-null",
  "role": "founder | student",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "image_url": null
}
~~~

Returns:

~~~json
{ "user": {} }
~~~

### List Users

`GET /api/users?role=student`

### User Detail

`GET /api/users/:userId`

Returns the user plus owned projects, contributions, submissions, and skills.

## Student Contribution APIs

### Start Or Update Task Contribution

`POST /api/tasks/:taskId/contributions`

~~~json
{
  "student_id": "uuid",
  "status": "active"
}
~~~

This creates or updates `project_contributors` using the task's `project_id`.

### List Task Project Contributors

`GET /api/tasks/:taskId/contributions`

## Submission Contract

`POST /api/submissions` remains backward-compatible with `student_name`, but new student profile code should send `student_id`.

~~~json
{
  "task_id": "uuid",
  "student_id": "uuid",
  "code": "...",
  "language": "typescript"
}
~~~

`GET /api/submissions?student_id=:studentId` filters a student's submissions.

## Skill Passport APIs

### Read Skill Passport

`GET /api/students/:studentId/skill-passport`

Returns the student plus aggregated `student_skills` and evidence records.

### Add Skill Evidence

`POST /api/students/:studentId/skill-passport/evidence`

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

Scores are averaged into `student_skills`; each assessment is preserved in `skill_evidence`.
