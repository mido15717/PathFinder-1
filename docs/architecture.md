# Architecture

## Frontend Architecture

The frontend is an Expo React Native app written in TypeScript.

- `components/common` contains shared UI primitives.
- `components/assessment` contains quiz controls.
- `components/career` contains career and match cards.
- `components/courses` contains course cards, search, filters, score badges, reason boxes, and empty states.
- `components/progress` contains progress bars, stat cards, course/skill progress cards, activity charting, status badges, and log timeline items.
- `components/analysis` contains score cards, readiness badges, skill gap cards, priority badges, and missing-skill course recommendations.
- `components/projects` contains project cards, project progress cards, portfolio score cards, checklist rows, link inputs, and badges.
- `contexts/AuthContext.tsx` owns auth state and token persistence.
- `navigation` contains auth, app stack, main tabs, and profile stack navigation.
- `screens/recommendations` contains course recommendations, course details, saved courses, and recommendation history.
- `screens/progress` contains the dashboard, course progress, skill progress, study activity, and progress logs screens.
- `screens/analysis` contains skill gap analysis, missing skills, career readiness, and readiness history screens.
- `screens/projects` contains suggested projects, project details, my projects, and portfolio readiness screens.
- `services` maps API responses and wraps HTTP calls.
- `types` separates API, navigation, assessment, career, match, course, recommendation, profile, and user contracts.

## Backend Architecture

The backend is a FastAPI application with layered modules.

- `db/seed_data.py` upserts the 10 career paths.
- `db/seed_courses.py` upserts 60 course/resource records with title + provider uniqueness.
- `models` builds MongoDB documents.
- `schemas` defines Pydantic request/response models.
- `services/rag_service.py` contains the hybrid semantic recommendation scorer.
- `services/recommendation_service.py` loads user context, stores results, and manages saved courses.
- `services/progress_monitoring_service.py` syncs course progress, skill progress, active learning path progress, study activity, and progress logs.
- `services/skill_gap_service.py` classifies required career skills into mastered, weak, missing, and priority groups.
- `services/readiness_service.py` calculates weighted career readiness from roadmap, skill, project, interview, certification, and portfolio signals.
- `services/project_service.py` manages project templates and per-user project progress.
- `services/portfolio_service.py` calculates GitHub/portfolio readiness from profile links and completed project evidence.
- `ml/utils/model_loader.py` caches uploaded model artifacts and keeps failures isolated.
- `ml/utils/preprocessing.py` transforms assessment/profile/progress context into the uploaded model feature shapes.
- `ml/services/*` runs personality, skills, and weighted ensemble predictions.
- `api/routes/courses.py`, `api/routes/recommendations.py`, `api/routes/learning_paths.py`, `api/routes/progress.py`, `api/routes/skill_gap.py`, `api/routes/readiness.py`, `api/routes/projects.py`, and `api/routes/portfolio.py` expose Milestone 3-7 APIs.
- `api/routes/ml_predictions.py` exposes the persisted ML career prediction API.

## MongoDB Collections

### `courses`

- `_id`
- `title`
- `description`
- `provider`
- `url`
- `course_type`
- `difficulty`
- `estimated_hours`
- `is_free`
- `rating`
- `language`
- `related_careers`
- `related_skills`
- `related_subjects`
- `tags`
- `prerequisites`
- `learning_outcomes`
- `source_dataset`
- `embedding_text`
- `created_at`
- `updated_at`
- `is_active`

### `course_recommendations`

- `_id`
- `user_id`
- `career_path_id`
- `assessment_id`
- `selected_career_title`
- `query`
- `recommended_courses`
- `filters_used`
- `generated_at`
- `created_at`

Each recommended course stores course id/title/provider/url, difficulty, type, skills, relevance score, reason, matched skills, missing skills covered, and priority.

### `saved_courses`

- `_id`
- `user_id`
- `course_id`
- `career_path_id`
- `title`
- `provider`
- `url`
- `status`
- `saved_at`

### `ml_career_predictions`

Stores AI career predictions generated from the uploaded ML assets:

- `user_id`
- `assessment_id`
- `selected_career_path_id`
- `input_summary`
- `rule_based_result`
- `personality_model_result`
- `skills_model_result`
- `ensemble_result`
- `final_recommended_career`
- `final_confidence_score`
- `top_3_careers`
- `explanation`
- `strengths`
- `missing_skills`
- `recommended_improvements`
- `created_at`

The collection is indexed by user, assessment, creation time, and final recommended career.

## ML Ensemble

The smart merge keeps existing rule-based matching and adds the uploaded models as extra signals:

- Rule-based matching contributes 40%.
- Skills model contributes 35%.
- Personality model contributes 25%.

The ensemble reweights available sources if a model dependency or artifact cannot load. This keeps authentication, assessment, matching, recommendations, learning paths, and analysis working even when local ML dependencies are not installed.

## RAG-Style Hybrid Scoring

Milestone 3 uses a clean semantic scoring layer that can later be replaced by embeddings or a vector database. Today it ranks active courses with deterministic matching:

- Career path relevance: 25%
- Skill match: 25%
- Missing skills coverage: 20%
- Favorite subjects relevance: 10%
- Career goal relevance: 10%
- Programming level / difficulty suitability: 5%
- Course quality/rating: 5%

The service builds a semantic query from selected career title, career goal, current skills, missing skills, and favorite subjects. It scores every active course, applies filters, removes duplicates, sorts by relevance, stores the result, and returns explanations.

Priority levels:

- Score >= 80: `high`
- Score 60-79: `medium`
- Below 60: `low`

## User Context

Course recommendations use:

- Current authenticated user
- `user_profiles.selected_career_path_id`
- `user_profiles.current_skills`
- Latest `career_assessments` record
- Selected `career_paths` document
- Active `courses` collection

## Adaptive Learning Path Collections

### `adaptive_learning_paths`

Stores the active or paused roadmap for a user:

- `user_id`
- `career_path_id`
- `assessment_id`
- `selected_career_title`
- `title`
- `description`
- `status`
- `overall_progress_percentage`
- `current_phase_id`
- `current_course_id`
- `weekly_available_hours`
- `target_completion_date`
- `generated_from`
- `phases`
- `next_best_course`
- `adaptation_rules`
- `last_adapted_at`
- `created_at`
- `updated_at`

Each phase stores lock state, required/optional skills, prerequisites, recommended courses, alternative courses, suggested projects, and progress.

### `learning_path_updates`

Stores every roadmap event:

- `generated`
- `course_started`
- `course_completed`
- `phase_completed`
- `recalculated`
- `adapted`

## Learning Path Generation

The adaptive path consumes Milestone 3 recommendation results instead of replacing RAG recommendations. Generation loads the selected career, latest assessment, latest recommendation result, saved courses, career-related courses, weekly hours, and deadline. It organizes courses into five phases:

1. Foundations
2. Core Computer Science
3. Career Specialization
4. Projects and Portfolio
5. Interview and Job Preparation

Phase 1 is unlocked by default. Later phases start locked. Completing all recommended courses in a phase marks it completed, unlocks the next phase, recalculates overall progress, and updates the next best course.

## Progress Monitoring Collections

### `user_course_progress`

Stores per-user course progress:

- `user_id`
- `course_id`
- `course_title`
- `provider`
- `difficulty`
- `estimated_hours`
- `status`
- `progress_percentage`
- `started_at`
- `completed_at`
- `career_path_id`
- `learning_path_id`
- `phase_id`
- `phase_title`
- `related_skills`
- `source`
- `notes`
- `created_at`
- `updated_at`

### `user_skill_progress`

Stores per-user skill progress:

- `user_id`
- `skill_name`
- `category`
- `level`
- `status`
- `progress_percentage`
- `completed_courses`
- `related_course_ids`
- `related_career_path_id`
- `last_updated_reason`
- `created_at`
- `updated_at`

### `study_activity_logs`

Stores one merged activity row per user/date:

- `user_id`
- `date`
- `minutes_spent`
- `courses_studied`
- `skills_practiced`
- `tasks_completed`
- `notes`
- `created_at`
- `updated_at`

### `progress_logs`

Stores recent timeline events for dashboard and future recommendation context:

- `user_id`
- `action_type`
- `title`
- `message`
- `entity_type`
- `entity_id`
- `metadata`
- `created_at`

## Progress Sync Rules

The progress service initializes course records from the active adaptive learning path, preserves user progress, and syncs completed/in-progress course status back into the path. Completing a course updates related skills in 25% increments, recalculates phase/overall path progress, and writes progress logs. Study activity is merged by user/date and powers the weekly chart and learning streak.

## Skill Gap Analysis Collections

### `skill_gap_analysis`

Stores each generated analysis:

- `user_id`
- `career_path_id`
- `selected_career_title`
- `analysis_date`
- `mastered_skills`
- `weak_skills`
- `missing_skills`
- `priority_skills`
- `skill_coverage_percentage`
- `total_required_skills`
- `mastered_count`
- `weak_count`
- `missing_count`
- `recommendations`
- `created_at`

Mastered skills include evidence from progress and completed courses. Weak and missing skills include priority, reason, and top recommended courses.

## Career Readiness Collections

### `career_readiness_scores`

Stores every readiness calculation:

- `user_id`
- `career_path_id`
- `selected_career_title`
- `total_score`
- `score_level`
- `roadmap_score`
- `skills_score`
- `projects_score`
- `interview_score`
- `certification_score`
- `portfolio_score`
- `score_breakdown`
- `strengths`
- `weaknesses`
- `recommendations`
- `next_actions`
- `calculated_at`
- `created_at`

## Skill Classification Rules

Required skills come from the selected `career_paths.required_skills`. The analysis uses `user_skill_progress`, completed course progress, profile skills, the latest assessment `current_skills`, active learning path phase skills, and recent recommended courses.

- Mastered: progress is at least 80%, or completed course evidence exists for the skill.
- Weak: progress is 30-79%, or the student listed the skill in assessment/profile but has no completed course evidence.
- Missing: progress is below 30%, or the required skill is absent from progress, assessment/profile skills, and completed course evidence.

Priority is high when a skill is needed for the current learning path phase or appears repeatedly in recommended courses, medium when it is required by the selected career, and low only for non-blocking/advanced context.

Skill coverage formula:

```text
(mastered_count + weak_count * 0.5) / total_required_skills * 100
```

## Readiness Score Formula

Career readiness is a weighted 0-100 score:

- Roadmap completion from active adaptive path progress: 30%
- Skill coverage from latest skill gap analysis: 25%
- Projects from completed project-oriented progress: 20%
- Interview preparation: 10%, currently 0 until Interview Prep exists
- Certifications: 10%, currently 0 until Certification Tracker exists
- Portfolio links: 5%, estimated from GitHub 40%, LinkedIn 30%, and portfolio URL 30%

Score levels:

- `beginner`: 0-39
- `developing`: 40-64
- `almost_ready`: 65-84
- `job_ready`: 85-100

Milestone 6 depends on Milestone 2 for selected career and assessment skills, Milestone 3 for course recommendations, Milestone 4 for adaptive learning path progress, and Milestone 5 for course/skill progress evidence.

## Projects Portfolio Collections

### `projects`

Stores reusable suggested project templates:

- `title`
- `slug`
- `description`
- `career_path_id`
- `related_careers`
- `difficulty`
- `required_skills`
- `tools`
- `estimated_duration_weeks`
- `instructions`
- `expected_output`
- `evaluation_criteria`
- `suggested_features`
- `learning_outcomes`
- `tags`
- `is_active`
- `created_at`
- `updated_at`

The seed script `python -m app.db.seed_projects` upserts project templates by unique slug.

### `user_project_progress`

Stores a student's project tracking state:

- `user_id`
- `project_id`
- `career_path_id`
- `title`
- `status`
- `progress_percentage`
- `github_link`
- `live_demo_link`
- `notes`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

Project progress starts at `not_started`, moves to `in_progress` when started, and reaches `completed` with progress 100. Updates recalculate portfolio readiness and create a Milestone 5 progress log when possible.

### `portfolio_readiness`

Stores GitHub/portfolio readiness:

- `user_id`
- `career_path_id`
- `score_percentage`
- `checklist`
- `strengths`
- `weaknesses`
- `recommendations`
- `calculated_at`
- `created_at`
- `updated_at`

Checklist fields:

- `github_profile_added`
- `linkedin_profile_added`
- `portfolio_url_added`
- `completed_project_exists`
- `github_links_added`
- `live_demo_links_added`
- `project_notes_added`
- `readme_quality_checked`
- `pinned_projects_ready`
- `screenshots_added`

## Portfolio Readiness Formula

Portfolio readiness totals 100 points:

- GitHub profile added: 15
- LinkedIn profile added: 10
- Portfolio URL added: 10
- At least one completed project: 20
- GitHub links on completed projects: 15
- Live demo links: 10
- Project notes/descriptions: 5
- README quality checked: 5
- Pinned projects ready: 5
- Screenshots added: 5

Score levels:

- `weak`: 0-39
- `improving`: 40-69
- `strong`: 70-84
- `excellent`: 85-100

Milestone 7 improves future Career Readiness by replacing the old profile-link-only portfolio estimate with the latest `portfolio_readiness.score_percentage` when available and by counting completed project progress in the projects readiness component.
