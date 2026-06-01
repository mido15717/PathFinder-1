# PathFinder Backend

FastAPI backend for PathFinder Milestones 1 and 2.

Milestone 1 covers authentication and profile basics. Milestone 2 adds career paths, assessments, career matching, and selected career persistence.

## Install

```powershell
cd PathFinder\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

## Run

Start MongoDB first, seed careers, then run the API:

```powershell
python -m app.db.seed_data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`

## Endpoints

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
- `GET /health`

## Collections

- `users`
- `user_profiles`
- `career_paths`
- `career_assessments`
- `career_matches`

Indexes are created on startup:

- Unique index on `users.email`
- Index on `user_profiles.user_id`
- Unique index on `career_paths.slug`
- Indexes on career title, active flag, user assessment history, and match lookup fields
