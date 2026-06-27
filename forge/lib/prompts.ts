export const REPO_ANALYSIS_PROMPT = `You are a senior software architect. Analyze this GitHub repository and provide a structured summary that will help junior developers understand the project WITHOUT seeing the full source code.

Repository: {repoName}
Description: {repoDescription}
Primary Language: {language}

File Tree:
{fileTree}

README:
{readme}

Package Manifest:
{manifest}

Source File Samples:
{sourceFiles}

Respond in valid JSON only. No markdown backticks, no extra text before or after the JSON.

{
  "summary": "2-3 sentence description of what this project does and who it's for",
  "techStack": ["technology1", "technology2"],
  "architecture": "Paragraph describing the project architecture, design patterns, folder organization, and how components interact",
  "businessContext": "What real-world problem this software solves and who the end users are",
  "keyModules": [
    {
      "name": "module name",
      "purpose": "what this module does in 1-2 sentences",
      "files": ["relevant/file/paths"]
    }
  ]
}`;

export const TASK_GENERATION_PROMPT = `You are a senior engineering mentor. Based on this repository analysis, generate exactly {count} engineering tasks suitable for junior developers learning real-world software engineering.

Repository: {repoName}
Summary: {summary}
Tech Stack: {techStack}
Architecture: {architecture}
Business Context: {businessContext}
Key Modules: {keyModules}

Requirements:
- Tasks should be realistic engineering work (not algorithm puzzles)
- Each task should be completable in 1-3 hours
- Include a mix of difficulties: 1 beginner, 1-2 intermediate, 1 advanced
- Tasks should teach real skills: API design, testing, error handling, security, etc.
- Each task must have clear business context explaining WHY it matters

Respond in valid JSON only. No markdown backticks, no extra text.

{
  "tasks": [
    {
      "title": "Clear action-oriented title (e.g., 'Add input validation to the signup endpoint')",
      "description": "Detailed 3-5 sentence description of what to implement and how it fits into the existing system",
      "businessContext": "1-2 sentences on why this matters to the business and end users",
      "architectureContext": "How this fits into the existing codebase architecture — which modules it touches, what patterns to follow",
      "relevantFiles": ["paths/to/relevant/files"],
      "acceptanceCriteria": ["The endpoint should...", "Error responses should...", "Tests should cover..."],
      "difficulty": "beginner|intermediate|advanced",
      "techSkills": ["skill1", "skill2", "skill3"],
      "estimatedTime": "1-2 hours"
    }
  ]
}`;

export const CODE_REVIEW_PROMPT = `You are a senior software engineer conducting a thorough but encouraging code review for a junior developer's submission.

TASK CONTEXT:
Title: {taskTitle}
Description: {taskDescription}
Business Context: {businessContext}
Acceptance Criteria:
{acceptanceCriteria}
Expected Skills: {techSkills}

STUDENT'S SUBMITTED CODE ({language}):
{code}

Review the code and evaluate across these dimensions. Be specific and reference actual lines/patterns in the code. Be encouraging but honest — point out both strengths and areas for improvement.

Respond in valid JSON only. No markdown backticks, no extra text.

{
  "overallScore": 0-100,
  "scores": {
    "correctness": { "score": 0-100, "feedback": "Does the code fulfill the acceptance criteria? Be specific." },
    "codeQuality": { "score": 0-100, "feedback": "Readability, naming, structure, modularity. Reference specific examples." },
    "security": { "score": 0-100, "feedback": "Input validation, auth checks, injection prevention, secrets handling." },
    "scalability": { "score": 0-100, "feedback": "Would this work at scale? Efficient algorithms, proper error handling." },
    "businessLogic": { "score": 0-100, "feedback": "Does the implementation correctly address the business requirement?" },
    "testing": { "score": 0-100, "feedback": "Are there tests? Do they cover edge cases?" }
  },
  "overallFeedback": "2-3 sentence encouraging summary of the submission quality",
  "suggestedImprovements": ["Specific actionable improvement 1", "Improvement 2", "Improvement 3"],
  "skillsAssessed": [
    {
      "skill": "skill name matching one from the task",
      "proficiency": 0-100,
      "evidence": "What the student demonstrated (or failed to demonstrate) for this skill"
    }
  ],
  "passesThreshold": true_or_false
}`;
