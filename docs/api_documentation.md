# API Documentation

Base URL: `http://localhost:8000`

Authenticated endpoints require `Authorization: Bearer <jwt-token>`.

## ML Career Predictions

### `POST /ml/predict-career`

Runs the weighted career ensemble for the authenticated user using the latest assessment and latest rule-based match. The result is stored in `ml_career_predictions`.

```powershell
curl -X POST http://localhost:8000/ml/predict-career `
  -H "Authorization: Bearer <token>"
```

### `POST /ml/predict-from-assessment/{assessment_id}`

Runs the same ensemble for a specific assessment owned by the authenticated user.

```powershell
curl -X POST http://localhost:8000/ml/predict-from-assessment/<assessment_id> `
  -H "Authorization: Bearer <token>"
```

### `GET /ml/predictions/latest`

Returns the latest stored ML career prediction.

### `GET /ml/predictions/me`

Returns all stored ML career predictions for the current user, newest first.

The response includes the final career, confidence score, top 3 careers, rule-based result, personality model result, skills model result, explanation, strengths, missing skills, and recommended improvements. If an ML model cannot run, its result includes `ML model is unavailable or input features are incomplete.` and the ensemble continues with available signals.

## Courses

### `GET /courses`

Returns a paginated course list.

Query params:

- `search`
- `difficulty`
- `provider`
- `course_type`
- `skill`
- `career_path_id`
- `limit`
- `page`

```powershell
curl "http://localhost:8000/courses?difficulty=beginner&skill=Python&limit=10&page=1"
```

### `GET /courses/{course_id}`

Returns course details.

```powershell
curl http://localhost:8000/courses/<course_id>
```

### `GET /courses/career/{career_path_id}`

Returns courses related to a career path.

```powershell
curl http://localhost:8000/courses/career/<career_path_id>
```

### `GET /courses/skills/{skill_name}`

Returns courses related to a skill.

```powershell
curl http://localhost:8000/courses/skills/FastAPI
```

## Recommendations

### `POST /recommendations/generate`

Generates personalized RAG-style course recommendations for the authenticated user. The backend automatically uses the user profile, selected career path, latest assessment, current skills, favorite subjects, career goal, and programming level.

```powershell
curl -X POST http://localhost:8000/recommendations/generate `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{"query":"backend api deployment","filters":{"difficulty":"intermediate","course_type":"course","max_results":10}}'
```

Response:

```json
{
  "recommendation_id": "recommendation-id",
  "selected_career": "Backend Developer",
  "query_used": "backend api deployment Backend Developer Python FastAPI",
  "recommended_courses": [
    {
      "course_id": "course-id",
      "title": "Python Backend with FastAPI",
      "provider": "Udemy",
      "url": "https://example.com/pathfinder/udemy/python-backend-with-fastapi",
      "difficulty": "beginner",
      "course_type": "course",
      "related_skills": ["Python", "FastAPI", "SQL", "MongoDB"],
      "relevance_score": 88,
      "recommendation_reason": "This course is recommended because it supports your selected career path Backend Developer...",
      "matched_skills": ["Python"],
      "missing_skills_covered": ["FastAPI"],
      "priority_level": "high"
    }
  ],
  "explanation_summary": "Recommendations are ranked for Backend Developer..."
}
```

### `GET /recommendations/me`

Returns the latest recommendation result for the current user.

```powershell
curl http://localhost:8000/recommendations/me -H "Authorization: Bearer <token>"
```

### `GET /recommendations/history`

Returns all recommendation results for the current user, newest first.

### `POST /recommendations/save-course`

Saves a course to the current user's learning list.

```powershell
curl -X POST http://localhost:8000/recommendations/save-course `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{"course_id":"<course_id>"}'
```

### `GET /recommendations/saved-courses`

Returns saved courses for the current user.

### `DELETE /recommendations/saved-courses/{course_id}`

Removes a saved course.

```powershell
curl -X DELETE http://localhost:8000/recommendations/saved-courses/<course_id> -H "Authorization: Bearer <token>"
```

## Existing Milestone 1 and 2 Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /users/me`
- `PUT /users/me`
- `GET /profiles/me`
- `PUT /profiles/me`
- `GET /careers`
- `GET /careers/{career_id}`
- `GET /careers/slug/{slug}`
- `POST /assessments/submit`
- `GET /assessments/me`
- `GET /assessments/history`
- `GET /matches/me`
- `POST /matches/select-career`

## Learning Paths

All learning path endpoints require JWT authentication.

### `POST /learning-paths/generate`

Generates a personalized adaptive learning path for the current user using the selected career, latest assessment, latest recommendations, saved courses, current skills, weekly hours, and target deadline.

```powershell
curl -X POST http://localhost:8000/learning-paths/generate `
  -H "Authorization: Bearer <token>"
```

Returns:

- `learning_path_id`
- `learning_path`
- `next_best_course`
- `explanation_summary`

### `GET /learning-paths/me`

Returns the current active learning path.

```powershell
curl http://localhost:8000/learning-paths/me -H "Authorization: Bearer <token>"
```

### `GET /learning-paths/{learning_path_id}`

Returns a specific learning path owned by the current user.

### `PATCH /learning-paths/course/{course_id}/start`

Marks a course inside the active path as `in_progress` and moves the phase to `in_progress`.

### `PATCH /learning-paths/course/{course_id}/complete`

Marks a course as `completed`, recalculates phase and overall progress, completes phases when requirements are satisfied, unlocks the next phase, updates the next best course, and logs the update.

### `PATCH /learning-paths/phase/{phase_id}/complete`

Marks a phase as completed when its recommended courses are completed, unlocks the next phase, and recalculates progress.

### `GET /learning-paths/next-course`

Returns the next best course from the active path.

### `POST /learning-paths/recalculate`

Regenerates the active learning path from the latest user context and pauses the previous active path.

### `GET /learning-paths/updates`

Returns update history for generated, course started, course completed, phase completed, recalculated, and adapted events.

## Progress Monitoring

All progress endpoints require JWT authentication.

### `GET /progress/summary`

Returns dashboard totals for overall progress, course counts, skill counts, weekly study time, learning streaks, active learning path progress, next recommended task, and recent logs.

```powershell
curl http://localhost:8000/progress/summary -H "Authorization: Bearer <token>"
```

### `GET /progress/courses`

Returns the current user's course progress grouped by `not_started`, `in_progress`, and `completed`. If the user has an active learning path, roadmap courses are initialized automatically.

### `PATCH /progress/courses/{course_id}`

Updates one course progress record.

```powershell
curl -X PATCH http://localhost:8000/progress/courses/<course_id> `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{"status":"completed","progress_percentage":100}'
```

Completing a course syncs active learning path progress and updates related skill records.

### `GET /progress/skills`

Returns skill progress grouped by status and category.

### `PATCH /progress/skills/{skill_name}`

Updates one skill progress record. Skill names with spaces or `/` should be URL-encoded by the client.

```powershell
curl -X PATCH http://localhost:8000/progress/skills/FastAPI `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{"status":"in_progress","progress_percentage":50}'
```

### `GET /progress/learning-path`

Returns active learning path progress, phase completion counts, current phase, and next best course.

### `POST /progress/recalculate`

Recalculates course, skill, and learning path progress from stored progress records.

### `POST /progress/activity`

Adds or merges a study activity log for a date.

```powershell
curl -X POST http://localhost:8000/progress/activity `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{"minutes_spent":45,"tasks_completed":2,"courses_studied":["FastAPI"],"skills_practiced":["APIs"],"notes":"Built auth routes"}'
```

### `GET /progress/activity/weekly`

Returns the last 7 days of study activity for the weekly chart.

### `GET /progress/activity/streak`

Returns current and longest learning streak.

### `GET /progress/logs`

Returns recent progress logs. Supports `limit` from 1 to 100.

## Skill Gap Analysis

All skill gap endpoints require JWT authentication.

### `POST /skill-gap/analyze`

Analyzes the current user's selected career path against assessment skills, profile skills, Milestone 5 skill progress, completed course evidence, learning path context, and recommended courses.

```powershell
curl -X POST http://localhost:8000/skill-gap/analyze `
  -H "Authorization: Bearer <token>"
```

Returns mastered skills, weak skills, missing skills, priority skills, skill coverage percentage, and recommendations.

### `GET /skill-gap/me`

Returns the latest skill gap analysis for the current user.

```powershell
curl http://localhost:8000/skill-gap/me -H "Authorization: Bearer <token>"
```

### `GET /skill-gap/history`

Returns all previous skill gap analyses for the current user, newest first.

### `GET /skill-gap/missing-skills`

Returns only weak and missing skills with priority data and top recommended courses.

```powershell
curl http://localhost:8000/skill-gap/missing-skills -H "Authorization: Bearer <token>"
```

## Career Readiness

All readiness endpoints require JWT authentication.

### `POST /readiness/calculate`

Calculates and stores a weighted 0-100 career readiness score.

Formula:

- Roadmap completion: 30%
- Skills completion: 25%
- Projects: 20%
- Interview preparation: 10%
- Certifications: 10%
- Portfolio/GitHub readiness: 5%

```powershell
curl -X POST http://localhost:8000/readiness/calculate `
  -H "Authorization: Bearer <token>"
```

Returns total score, score level, breakdown, strengths, weaknesses, recommendations, and next actions.

### `GET /readiness/me`

Returns the latest readiness score for the current user.

```powershell
curl http://localhost:8000/readiness/me -H "Authorization: Bearer <token>"
```

### `GET /readiness/history`

Returns previous readiness calculations for the current user, newest first.

## Projects Portfolio

All project endpoints require JWT authentication.

### `GET /projects`

Returns suggested project templates for the selected career path with current user progress when available.

Query params:

- `career_path_id`
- `difficulty`
- `status`

```powershell
curl "http://localhost:8000/projects?difficulty=intermediate" -H "Authorization: Bearer <token>"
```

### `GET /projects/career/{career_path_id}`

Returns project templates for a specific career path.

### `GET /projects/{project_id}`

Returns project details with the current user's progress record if available.

### `POST /projects/{project_id}/start`

Creates or updates `user_project_progress` with `status=in_progress`, `started_at`, and default `progress_percentage=10`.

```powershell
curl -X POST http://localhost:8000/projects/<project_id>/start -H "Authorization: Bearer <token>"
```

### `PATCH /projects/{project_id}/progress`

Updates project progress, GitHub link, live demo link, notes, and status. Setting `status=completed` sets progress to 100 and records `completed_at`.

```powershell
curl -X PATCH http://localhost:8000/projects/<project_id>/progress `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{"status":"completed","github_link":"https://github.com/me/api","live_demo_link":"https://demo.example.com","notes":"JWT auth, CRUD, and docs included."}'
```

The service writes a progress log when Milestone 5 progress logs are available and recalculates portfolio readiness.

### `GET /projects/me`

Returns user project progress grouped by `not_started`, `in_progress`, and `completed`.

## Portfolio Readiness

All portfolio endpoints require JWT authentication.

### `GET /portfolio/readiness`

Returns the latest portfolio readiness result. If none exists, the backend calculates one.

### `POST /portfolio/readiness/calculate`

Calculates GitHub/portfolio readiness from profile links, completed projects, repository/demo links, project notes, and manual checklist items.

```powershell
curl -X POST http://localhost:8000/portfolio/readiness/calculate -H "Authorization: Bearer <token>"
```

### `PATCH /portfolio/checklist`

Updates manual checklist items:

- `readme_quality_checked`
- `pinned_projects_ready`
- `screenshots_added`

```powershell
curl -X PATCH http://localhost:8000/portfolio/checklist `
  -H "Authorization: Bearer <token>" `
  -H "Content-Type: application/json" `
  -d '{"readme_quality_checked":true,"pinned_projects_ready":true,"screenshots_added":true}'
```
