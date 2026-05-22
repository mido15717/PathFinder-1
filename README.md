# PathFinder

PathFinder is a full-stack graduation project for Computer Science students. It helps students discover suitable career paths, generate personalized learning roadmaps, track course and skill progress, and manage their academic profile.

## Structure

- `frontend/` - Expo React Native TypeScript mobile app.
- `backend/` - FastAPI backend with modular routes, services, schemas, database models, and JWT auth.
- `docs/` - Project, setup, API, and database documentation.
- `assets/` - Project-level logo, screenshots, and diagrams.
- `tests/` - Frontend and backend tests.

## Run Frontend

```powershell
cd frontend
npm install
npx expo start
```

To connect the frontend to the FastAPI backend:

```powershell
$env:EXPO_PUBLIC_API_MODE='backend'
$env:EXPO_PUBLIC_API_BASE_URL='http://localhost:8000'
npx expo start
```

Without `EXPO_PUBLIC_API_MODE=backend`, the app uses its local mock services for demo resilience.

## Run Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m app.db.seed_data
uvicorn app.main:app --reload
```

Backend docs are available at:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

## Main API Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `PUT /users/me`
- `GET /careers`
- `GET /careers/{career_id}`
- `POST /assessments/submit`
- `GET /roadmaps/my-roadmap`
- `POST /roadmaps/generate`
- `PATCH /roadmaps/progress`
- `GET /progress/summary`
- `GET /progress/courses`
- `PATCH /progress/courses/{course_id}`
- `GET /progress/roadmap`
- `PATCH /progress/roadmap/phase/{phase_id}`
- `POST /progress/recalculate`

## Progress Monitoring System

Progress monitoring is not only part of the recommendation algorithm itself. It is implemented at the full-system level using the frontend and database to track each student’s course completion and learning progress over time. Later, this tracked progress can be passed to the recommendation backend so the RAG/LLM module can adapt future course recommendations based on what the student has already completed.
