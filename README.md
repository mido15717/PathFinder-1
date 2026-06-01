# PathFinder

PathFinder: Personalized Career and Learning Roadmaps for CS Students.

Milestone 1 delivered the full-stack foundation: Expo frontend, FastAPI backend, MongoDB connection, JWT authentication, register/login/logout, and profile basics.

Milestone 2 adds the Career Assessment and Career Matching System: students complete a multi-step quiz, the backend stores the assessment, calculates top matching CS careers, returns the top 3 matches, and lets the student select one target career path.

## Tech Stack

- Frontend: Expo, React Native, TypeScript, React Navigation, AsyncStorage, Context API
- Backend: FastAPI, MongoDB, Motor, Pydantic, JWT, passlib/bcrypt
- Database: MongoDB

## Folder Structure

```text
PathFinder/
  frontend/
    src/
      components/common/
      components/assessment/
      components/career/
      constants/
      contexts/
      navigation/
      screens/auth/
      screens/assessment/
      screens/career/
      screens/main/
      screens/profile/
      services/
      types/
      utils/
    App.tsx
    package.json
    app.json
    tsconfig.json
    .env.example
  backend/
    app/
      main.py
      api/routes/
      core/
      db/
      models/
      schemas/
      services/
      utils/
    requirements.txt
    .env.example
    README.md
  docs/
    architecture.md
    api_documentation.md
  assets/
    logo/
    screenshots/
```

## Backend Setup

Start MongoDB before running the backend:

```powershell
docker run --name pathfinder-mongo -p 27017:27017 -d mongo:7
```

Install and run:

```powershell
cd PathFinder\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m app.db.seed_data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

```powershell
cd PathFinder\frontend
npm install
copy .env.example .env
npm run web
```

## Environment Variables

Backend `.env`:

- `APP_NAME`
- `ENVIRONMENT`
- `MONGO_URI`
- `DATABASE_NAME`
- `JWT_SECRET_KEY`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `CORS_ORIGINS`

Frontend `.env`:

- `EXPO_PUBLIC_API_BASE_URL`

## Milestone 2 Test Flow

1. Start MongoDB.
2. Start the FastAPI backend.
3. Run `python -m app.db.seed_data`.
4. Start the Expo frontend.
5. Register or log in.
6. Open Career Assessment.
7. Complete the 9-step quiz.
8. Submit the quiz.
9. See the top 3 career matches.
10. Select a career path.
11. Confirm Home/Profile show the selected career.
12. Confirm MongoDB contains `career_assessments` and `career_matches` records.
