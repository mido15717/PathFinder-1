# Architecture

## Frontend Architecture

The frontend is an Expo React Native app written in TypeScript.

- `components/common` contains shared buttons, inputs, cards, headers, loading, and error messages.
- `components/assessment` contains assessment-specific option cards, chips, and progress UI.
- `components/career` contains career cards, match cards, skill badges, and match percentage bars.
- `contexts/AuthContext.tsx` owns auth state, token persistence, login, register, logout, and session restore.
- `navigation` contains auth, app stack, main tabs, and profile stack navigation.
- `screens/assessment` contains the multi-step quiz and match result screen.
- `screens/career` contains career details.
- `screens/main` contains the Home dashboard and Explore Careers tab.
- `screens/profile` contains profile display and edit flow.
- `services` maps API responses and wraps HTTP calls.
- `types` separates API, navigation, assessment, career, match, profile, and user contracts.

## Backend Architecture

The backend is a FastAPI application with a layered structure.

- `core/config.py` reads environment variables.
- `core/security.py` handles password hashing and JWT token encode/decode.
- `db/mongodb.py` owns MongoDB startup/shutdown.
- `db/indexes.py` creates collection indexes.
- `db/seed_data.py` safely upserts the 10 Milestone 2 career paths.
- `models` builds MongoDB documents.
- `schemas` defines Pydantic request/response models.
- `services` contains authentication, profile, career, assessment, and matching business logic.
- `api/routes` contains thin route handlers.
- `utils/object_id.py` serializes MongoDB ObjectIds for API responses.

## MongoDB Collections

### `users`

Stores authentication identity:

- `_id`
- `full_name`
- `email`
- `password_hash`
- `role`
- `is_active`
- `is_verified`
- `created_at`
- `updated_at`
- `last_login`

### `user_profiles`

Stores student profile and selected career state:

- `_id`
- `user_id`
- `university`
- `college`
- `academic_year`
- `major`
- `country`
- `city`
- `bio`
- `avatar_url`
- `github_url`
- `linkedin_url`
- `portfolio_url`
- `preferred_language`
- `weekly_available_hours`
- `preferred_learning_style`
- `career_goal`
- `current_skills`
- `selected_career_path_id`
- `selected_career_title`
- `created_at`
- `updated_at`

### `career_paths`

Seeded career catalog:

- `_id`
- `title`
- `slug`
- `description`
- `overview`
- `difficulty_level`
- `average_duration_months`
- `required_skills`
- `recommended_tools`
- `responsibilities`
- `suggested_projects`
- `recommended_certifications`
- `market_demand`
- `salary_level`
- `tags`
- `related_subjects`
- `preferred_personality_traits`
- `preferred_learning_styles`
- `icon`
- `color`
- `is_active`
- `created_at`
- `updated_at`

### `career_assessments`

Stores every submitted quiz:

- `_id`
- `user_id`
- `preferred_area`
- `programming_level`
- `favorite_subjects`
- `current_skills`
- `career_goal`
- `learning_style`
- `weekly_available_hours`
- `preferred_work_type`
- `target_deadline_months`
- `personality_traits`
- `answers`
- `completed_at`
- `created_at`

### `career_matches`

Stores calculated top matches:

- `_id`
- `user_id`
- `assessment_id`
- `matches`
- `best_match_career_id`
- `selected_career_id`
- `created_at`
- `updated_at`

Each item in `matches` includes career id/title/slug, match percentage, match level, reasons, strengths, weaknesses, recommended improvements, matched skills, and missing skills.

## Matching Algorithm

The matching service scores each active career from 0 to 100 with the requested weights:

- Preferred CS area match: 25%
- Current skills match with required career skills: 25%
- Favorite subjects match: 15%
- Career goal and preferred work type match: 15%
- Programming level suitability: 10%
- Learning style compatibility: 5%
- Weekly available hours suitability: 5%

The backend loads all active careers, scores each career, sorts by highest score, stores the top 3, and returns them to the frontend.

Match levels:

- 85 to 100: `excellent`
- 70 to 84: `high`
- 50 to 69: `medium`
- Below 50: `low`

## Frontend Assessment Flow

1. Home quick action opens `CareerAssessmentScreen`.
2. The student completes the 9-step quiz.
3. The frontend posts answers to `POST /assessments/submit`.
4. The backend stores the assessment and match result.
5. `AssessmentResultScreen` displays the top 3 matches.
6. The student selects one career with `POST /matches/select-career`.
7. Home and Profile display the selected career path.
