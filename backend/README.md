# PathFinder Backend

Professional FastAPI + MongoDB backend for **PathFinder: Personalized Career and Learning Roadmaps for CS Students**.

## Architecture

```text
backend/
  app/
    main.py
    core/
      config.py
      security.py
    db/
      mongodb.py
      indexes.py
      seed_data.py
    models/
      user_model.py
      profile_model.py
      career_model.py
      roadmap_model.py
      skill_model.py
      project_model.py
      progress_model.py
      resume_model.py
      interview_model.py
      certification_model.py
      notification_model.py
    schemas/
      auth_schema.py
      user_schema.py
      profile_schema.py
      career_schema.py
      roadmap_schema.py
      skill_schema.py
      project_schema.py
      progress_schema.py
      resume_schema.py
      interview_schema.py
      certification_schema.py
      notification_schema.py
    services/
      auth_service.py
      user_service.py
      career_service.py
      assessment_service.py
      matching_service.py
      roadmap_service.py
      skill_service.py
      project_service.py
      progress_service.py
      readiness_service.py
      resume_service.py
      interview_service.py
      certification_service.py
      notification_service.py
    api/
      routes/
        auth.py
        users.py
        profiles.py
        careers.py
        assessments.py
        roadmaps.py
        skills.py
        projects.py
        progress.py
        readiness.py
        resumes.py
        interviews.py
        certifications.py
        notifications.py
    utils/
      object_id.py
      validators.py
      helpers.py
      response.py
  requirements.txt
  .env.example
  README.md
```

## MongoDB Collections

The backend uses these collections:

`users`, `user_profiles`, `career_paths`, `career_assessments`, `career_matches`, `roadmaps`, `user_roadmaps`, `skills`, `user_skills`, `learning_resources`, `projects`, `user_projects`, `study_plans`, `user_learning_paths`, `user_course_progress`, `user_skill_progress`, `progress_logs`, `career_readiness_scores`, `resumes`, `interview_questions`, `user_interview_progress`, `certifications`, `user_certifications`, `notifications`, `user_settings`, `activity_logs`.

Indexes are created automatically on startup from `app/db/indexes.py`.

## Setup

1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Start MongoDB locally or with Docker:

```powershell
docker run --name pathfinder-mongo -p 27017:27017 -d mongo:7
```

4. Create `.env` from `.env.example` and set a strong `JWT_SECRET_KEY`.

## Seed Database

```powershell
python -m app.db.seed_data
```

The seed command upserts career paths, skills, roadmap templates, learning resources, suggested projects, interview questions, and certifications. It is safe to run more than once.

## Run API

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

- API health: `http://localhost:8000/health`
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Frontend Integration

Use JSON requests and store the JWT access token returned from `POST /auth/login`.

```ts
const API_URL = "http://localhost:8000";

const loginResponse = await fetch(`${API_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const { access_token } = await loginResponse.json();

const profileResponse = await fetch(`${API_URL}/profiles/me`, {
  headers: { Authorization: `Bearer ${access_token}` },
});
```

Recommended first-user flow:

1. `POST /auth/register`
2. `POST /auth/login`
3. `PUT /profiles/me`
4. `POST /assessments/submit`
5. `GET /matches/me`
6. `POST /roadmaps/generate`
7. Track progress through skills, projects, study plans, interviews, certifications, and readiness endpoints.

## Main Endpoints

- Authentication: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- Users/Profile: `GET /users/me`, `PUT /users/me`, `GET /profiles/me`, `PUT /profiles/me`
- Careers: `GET /careers`, `GET /careers/{career_id}`, `POST /careers`, `PUT /careers/{career_id}`, `DELETE /careers/{career_id}`
- Assessment: `POST /assessments/submit`, `GET /assessments/me`, `GET /matches/me`
- Roadmaps: `GET /roadmaps`, `GET /roadmaps/{roadmap_id}`, `GET /roadmaps/career/{career_id}`, `POST /roadmaps/generate`, `GET /roadmaps/my-roadmap`, `PATCH /roadmaps/progress`
- Progress Monitoring System: `GET /progress/summary`, `GET /progress/courses`, `PATCH /progress/courses/{course_id}`, `GET /progress/roadmap`, `PATCH /progress/roadmap/phase/{phase_id}`, `GET /progress/logs`, `POST /progress/recalculate`
- Skills: `GET /skills`, `GET /skills/{skill_id}`, `GET /skills/me`, `POST /skills/me`, `PATCH /skills/me/{skill_id}`
- Projects: `GET /projects`, `GET /projects/career/{career_id}`, `GET /projects/me`, `POST /projects/me`, `PATCH /projects/me/{project_id}`
- Study Planner: `POST /study-plans/generate`, `GET /study-plans/me`, `PATCH /study-plans/task`
- Readiness: `GET /readiness/me`, `POST /readiness/calculate`
- Resume: `GET /resumes/me`, `POST /resumes`, `PUT /resumes/me`
- Interview: `GET /interviews/questions/{career_id}`, `GET /interviews/progress/me`, `PATCH /interviews/progress/{question_id}`
- Certifications: `GET /certifications`, `GET /certifications/career/{career_id}`, `GET /certifications/me`, `PATCH /certifications/me/{certification_id}`
- Notifications: `GET /notifications`, `PATCH /notifications/{notification_id}/read`, `DELETE /notifications/{notification_id}`
