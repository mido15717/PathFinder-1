# Database Schema

PathFinder uses MongoDB as the main database through Motor.

## Core Collections

- `users` - Authentication identity, hashed password, role, active/verified state, timestamps, and last login.
- `user_profiles` - University, academic year, GPA, location, links, learning preferences, weekly hours, and career goal.
- `career_paths` - Seeded CS career tracks such as AI Engineer, Backend Developer, Cloud Engineer, and UI/UX Designer.
- `career_assessments` - Submitted assessment answers and learner preferences.
- `career_matches` - Top career matches with percentages, reasons, strengths, weaknesses, and improvements.
- `roadmaps` - Career roadmap templates with ordered phases, skills, resources, and projects.
- `user_roadmaps` - Per-student roadmap status, current phase, overall progress, and phase progress.
- `skills`, `user_skills` - Global skills and student-owned skill tracking.
- `learning_resources` - Courses, videos, books, documentation, articles, and platforms.
- `projects`, `user_projects` - Suggested projects and student project completion.
- `study_plans` - Weekly generated learning schedules.
- `career_readiness_scores` - Career readiness score breakdown.
- `resumes` - Resume-builder data.
- `interview_questions`, `user_interview_progress` - Interview prep content and student practice state.
- `certifications`, `user_certifications` - Recommended certifications and student certification progress.
- `notifications`, `user_settings`, `activity_logs` - Notifications, preferences, and system activity.

## Progress Monitoring Collections

### `user_learning_paths`

| Field | Purpose |
| --- | --- |
| `_id` | MongoDB ObjectId |
| `user_id` | Student reference |
| `career_path_id` | Selected career path |
| `roadmap_id` | Saved roadmap template |
| `selected_courses` | Courses/resources attached to the learning path |
| `current_phase_id` | Current roadmap phase |
| `status` | `not_started`, `in_progress`, or `completed` |
| `overall_progress_percentage` | Saved full learning path progress |
| `created_at`, `updated_at` | Timestamps |

### `user_course_progress`

| Field | Purpose |
| --- | --- |
| `_id` | MongoDB ObjectId |
| `user_id` | Student reference |
| `course_id` | Learning resource ObjectId |
| `course_title` | Course/resource title |
| `related_skills` | Skills improved by the course |
| `career_path_id` | Career path reference |
| `roadmap_phase_id` | Roadmap phase reference |
| `status` | `not_started`, `in_progress`, or `completed` |
| `progress_percentage` | Course completion percentage |
| `started_at`, `completed_at`, `last_updated_at` | Progress timestamps |

### `user_skill_progress`

| Field | Purpose |
| --- | --- |
| `_id` | MongoDB ObjectId |
| `user_id` | Student reference |
| `skill_id` | Skill ObjectId when available |
| `skill_name` | Skill display name |
| `level` | `beginner`, `intermediate`, or `advanced` |
| `status` | `not_started`, `in_progress`, or `completed` |
| `progress_percentage` | Skill completion percentage |
| `source_course_id` | Course that updated this skill |
| `updated_at` | Last progress update |

### `progress_logs`

| Field | Purpose |
| --- | --- |
| `_id` | MongoDB ObjectId |
| `user_id` | Student reference |
| `action_type` | Event name such as `course.progress_updated` |
| `entity_type` | Course, skill, roadmap phase, or learning path |
| `entity_id` | Related entity ObjectId when available |
| `description` | Human-readable event |
| `old_status`, `new_status` | Status transition |
| `progress_value` | Progress value at event time |
| `created_at` | Event timestamp |

Indexes are created automatically in `backend/app/db/indexes.py`, including user, career, roadmap, course, skill, status, and timestamp indexes for progress queries.
