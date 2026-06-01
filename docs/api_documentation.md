# API Documentation

Base URL: `http://localhost:8000`

Authenticated endpoints require:

```http
Authorization: Bearer <jwt-token>
```

## Health

### `GET /health`

Returns backend status.

```json
{
  "status": "ok",
  "service": "PathFinder API"
}
```

## Authentication

### `POST /auth/register`

```json
{
  "full_name": "Fatma Ahmed",
  "email": "fatma@example.com",
  "password": "password123"
}
```

Returns a JWT token and the created user.

### `POST /auth/login`

```json
{
  "email": "fatma@example.com",
  "password": "password123"
}
```

Returns a JWT token and the user.

### `GET /auth/me`

Returns the current authenticated user.

### `POST /auth/logout`

Returns:

```json
{
  "message": "Logged out successfully"
}
```

## Profiles

### `GET /profiles/me`

Returns the current user's profile, including Milestone 2 career fields:

- `current_skills`
- `selected_career_path_id`
- `selected_career_title`
- `career_goal`
- `weekly_available_hours`
- `preferred_learning_style`

### `PUT /profiles/me`

Updates profile basics.

```json
{
  "university": "Ain Shams University",
  "college": "Faculty of Computer and Information Sciences",
  "academic_year": "Fourth year",
  "major": "Computer Science",
  "career_goal": "Backend Developer",
  "weekly_available_hours": 10,
  "preferred_learning_style": "Project-based learning",
  "current_skills": ["Python", "FastAPI", "MongoDB"]
}
```

## Careers

### `GET /careers`

Returns all active seeded career paths.

```bash
curl http://localhost:8000/careers
```

### `GET /careers/{career_id}`

Returns one active career path by MongoDB id.

```bash
curl http://localhost:8000/careers/<career_id>
```

### `GET /careers/slug/{slug}`

Returns one active career path by slug.

```bash
curl http://localhost:8000/careers/slug/backend-developer
```

Career response fields include:

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

## Assessments

### `POST /assessments/submit`

Stores a career assessment, calculates career matches, stores the match result, updates profile learning fields, and returns the top 3 matches.

```bash
curl -X POST http://localhost:8000/assessments/submit ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"preferred_area\":\"Artificial Intelligence\",\"programming_level\":\"Intermediate\",\"favorite_subjects\":[\"Mathematics\",\"Artificial Intelligence\"],\"current_skills\":[\"Python\",\"Data Analysis\",\"Git/GitHub\"],\"career_goal\":\"Learn a specialization\",\"learning_style\":\"Project-based learning\",\"weekly_available_hours\":10,\"preferred_work_type\":\"Research and experimentation\",\"target_deadline_months\":6,\"personality_traits\":[],\"answers\":{}}"
```

Response:

```json
{
  "assessment_id": "assessment-id",
  "match_id": "match-id",
  "matches": [
    {
      "career_path_id": "career-id",
      "career_title": "AI Engineer",
      "career_slug": "ai-engineer",
      "match_percentage": 87,
      "match_level": "excellent",
      "reasons": ["Your interest in Artificial Intelligence aligns strongly with AI Engineer."],
      "strengths": ["Python", "Artificial Intelligence"],
      "weaknesses": ["Needs stronger Statistics."],
      "recommended_improvements": ["Build fundamentals in Statistics."],
      "matched_skills": ["Python", "Data Analysis"],
      "missing_skills": ["Machine Learning", "Statistics"]
    }
  ]
}
```

### `GET /assessments/me`

Returns the latest assessment for the current user.

### `GET /assessments/history`

Returns all assessments for the current user, newest first.

## Matches

### `GET /matches/me`

Returns the latest career match result for the current user.

```bash
curl http://localhost:8000/matches/me -H "Authorization: Bearer <token>"
```

### `POST /matches/select-career`

Saves a target career to the latest match result when one exists and updates `user_profiles`.

```bash
curl -X POST http://localhost:8000/matches/select-career ^
  -H "Authorization: Bearer <token>" ^
  -H "Content-Type: application/json" ^
  -d "{\"career_path_id\":\"<career_id>\"}"
```

Response:

```json
{
  "selected_career_id": "career-id",
  "selected_career_title": "AI Engineer",
  "match_id": "match-id"
}
```
