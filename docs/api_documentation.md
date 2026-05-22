# API Documentation

Base URL: `http://localhost:8000`

## Authentication

- `POST /auth/register` - Registers a student. Passwords are hashed before storage.
- `POST /auth/login` - Returns a JWT access token.
- `GET /auth/me` - Returns the authenticated user.
- `POST /auth/logout` - Client-side logout acknowledgement.

## Users And Profiles

- `GET /users/me`
- `PUT /users/me`
- `GET /profiles/me`
- `PUT /profiles/me`

## Careers And Assessment

- `GET /careers`
- `GET /careers/{career_id}`
- `POST /careers`
- `PUT /careers/{career_id}`
- `DELETE /careers/{career_id}`
- `POST /assessments/submit`
- `GET /assessments/me`
- `GET /matches/me`

## Roadmaps

- `GET /roadmaps`
- `GET /roadmaps/{roadmap_id}`
- `GET /roadmaps/career/{career_id}`
- `POST /roadmaps/generate`
- `GET /roadmaps/my-roadmap`
- `PATCH /roadmaps/progress`

## Progress Monitoring System

Progress monitoring is not only part of the recommendation algorithm itself. It is implemented at the full-system level using the frontend and database to track each student’s course completion and learning progress over time. Later, this tracked progress can be passed to the recommendation backend so the RAG/LLM module can adapt future course recommendations based on what the student has already completed.

- `GET /progress/summary` - Returns overall roadmap progress, completed courses count, in-progress courses count, completed skills count, current phase, next recommended task, and recent activity.
- `GET /progress/courses` - Returns all tracked courses grouped into `not_started`, `in_progress`, and `completed`.
- `PATCH /progress/courses/{course_id}` - Updates a course status/progress percentage. Completing a course updates related skills and writes a progress log.
- `GET /progress/roadmap` - Returns phase-by-phase roadmap progress with completed courses and skills.
- `PATCH /progress/roadmap/phase/{phase_id}` - Updates one roadmap phase status/progress.
- `GET /progress/logs` - Returns recent progress history.
- `POST /progress/recalculate` - Recalculates saved learning-path progress from courses, skills, and roadmap phases.

Course update request:

```json
{
  "status": "completed",
  "progress_percentage": 100
}
```

Phase update request:

```json
{
  "status": "in_progress",
  "progress_percentage": 60
}
```

## Study Planner

- `POST /study-plans/generate`
- `GET /study-plans/me`
- `PATCH /study-plans/task`

## Platform Modules

- `GET /skills`
- `GET /skills/{skill_id}`
- `GET /skills/me`
- `POST /skills/me`
- `PATCH /skills/me/{skill_id}`
- `GET /projects`
- `GET /projects/career/{career_id}`
- `GET /projects/me`
- `POST /projects/me`
- `PATCH /projects/me/{project_id}`
- `GET /readiness/me`
- `POST /readiness/calculate`
- `GET /resumes/me`
- `POST /resumes`
- `PUT /resumes/me`
- `GET /interviews/questions/{career_id}`
- `GET /interviews/progress/me`
- `PATCH /interviews/progress/{question_id}`
- `GET /certifications`
- `GET /certifications/career/{career_id}`
- `GET /certifications/me`
- `PATCH /certifications/me/{certification_id}`
- `GET /notifications`
- `PATCH /notifications/{notification_id}/read`
- `DELETE /notifications/{notification_id}`
