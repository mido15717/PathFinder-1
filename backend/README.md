# PathFinder Backend

FastAPI backend for PathFinder Milestones 1, 2, and 3.

- Milestone 1: authentication and profile basics
- Milestone 2: career paths, assessment, matching, selected career persistence
- Milestone 3: course catalog, RAG-style recommendations, saved courses
- Milestone 4: adaptive learning paths, phase roadmap, next best course, update history

## Install

```powershell
cd PathFinder\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

## Run

Start MongoDB first, seed data, then run the API:

```powershell
python -m app.db.seed_data
python -m app.db.seed_courses
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`

## Milestone 3 Endpoints

- `GET /courses`
- `GET /courses/{course_id}`
- `GET /courses/career/{career_path_id}`
- `GET /courses/skills/{skill_name}`
- `POST /recommendations/generate`
- `GET /recommendations/me`
- `GET /recommendations/history`
- `POST /recommendations/save-course`
- `GET /recommendations/saved-courses`
- `DELETE /recommendations/saved-courses/{course_id}`
- `POST /learning-paths/generate`
- `GET /learning-paths/me`
- `GET /learning-paths/{learning_path_id}`
- `PATCH /learning-paths/course/{course_id}/start`
- `PATCH /learning-paths/course/{course_id}/complete`
- `PATCH /learning-paths/phase/{phase_id}/complete`
- `GET /learning-paths/next-course`
- `POST /learning-paths/recalculate`
- `GET /learning-paths/updates`

## Collections

- `users`
- `user_profiles`
- `career_paths`
- `career_assessments`
- `career_matches`
- `courses`
- `course_recommendations`
- `saved_courses`
- `adaptive_learning_paths`
- `learning_path_updates`
