# PathFinder

PathFinder: Personalized Career and Learning Roadmaps for CS Students.

Milestone 1 delivered the full-stack foundation: Expo frontend, FastAPI backend, MongoDB, JWT authentication, register/login/logout, and profile basics.

Milestone 2 added Career Assessment and Career Matching: students complete a quiz, receive top 3 CS career matches, and save one target career path.

Milestone 3 adds the RAG-Based Course Recommendation System: students generate personalized course recommendations from their selected career, latest assessment, current skills, favorite subjects, career goal, and programming level. They can search/filter recommendations, view course details, save courses, and review recommendation history.

Milestone 4 adds the Adaptive Learning Path System: students generate a phase-based roadmap from their selected career, assessment, recommendations, saved courses, weekly hours, and target deadline. They can view locked/unlocked phases, see the next best course, start/complete courses, and watch the path update automatically.

Milestone 5 adds Progress Monitoring: students track overall roadmap progress, course completion, skill growth, weekly study activity, learning streaks, and recent progress logs. Completing a course can automatically update related skill progress.

Milestone 6 adds Skill Gap Analysis and Career Readiness Score: students compare current/progress skills against their selected career, see mastered/weak/missing/priority skills, get missing-skill course recommendations, and calculate a weighted 0-100 readiness score.

Milestone 7 adds Projects Portfolio and GitHub Portfolio Readiness: students view suggested career projects, start and complete projects, add GitHub/demo links and notes, and calculate a portfolio readiness checklist score.

ML integration adds a smart career-prediction layer from the uploaded PathFinder assets: trained personality and skills models, datasets, notebooks moved to research, persisted AI predictions, and an ensemble that blends existing rule-based matching with model predictions.

## Tech Stack

- Frontend: Expo, React Native, TypeScript, React Navigation, AsyncStorage, Context API
- Backend: FastAPI, MongoDB, Motor, Pydantic, JWT, passlib/bcrypt
- Recommendation logic: Hybrid RAG-style semantic keyword scoring, designed to be replaceable with embeddings later
- Progress logic: MongoDB-backed course, skill, study activity, and log tracking that can feed future recommendations
- Analysis logic: Skill gap classification and weighted career readiness scoring
- Portfolio logic: Suggested project templates, per-user project progress, and GitHub/portfolio readiness scoring
- ML logic: Cached model loading, assessment preprocessing, skills/personality predictions, and weighted ensemble career prediction

## Folder Structure

```text
PathFinder/
  frontend/src/
    components/{common,analysis,assessment,career,courses,progress}/
    contexts/
    navigation/
    screens/{auth,analysis,assessment,career,main,profile,recommendations,progress}/
    screens/learningPath/
    services/
    types/
    utils/
  backend/app/
    api/routes/
    core/
    db/
    models/
    schemas/
    services/
    utils/
    ml/
      data/
      models/{personality,skills}/
      services/
      utils/
  research/notebooks/
  docs/
    architecture.md
    api_documentation.md
    ml_integration.md
```

## Backend Setup

```powershell
cd PathFinder\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m app.db.seed_data
python -m app.db.seed_courses
python -m app.db.seed_projects
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Start MongoDB before seeding/running the backend:

```powershell
docker run --name pathfinder-mongo -p 27017:27017 -d mongo:7
```

## Frontend Setup

```powershell
cd PathFinder\frontend
npm install
copy .env.example .env
npm run web
```

## ML Prediction Test Flow

1. Start MongoDB.
2. Start the FastAPI backend on port 8000.
3. Start the Expo frontend.
4. Register or log in.
5. Complete Career Assessment.
6. Open Assessment Results and run AI Career Prediction.
7. Confirm Home shows the latest AI predicted career.
8. Run Skill Gap Analysis and check ML-sourced missing skills.
9. Generate Course Recommendations and check ML-prioritized reasons.
10. Generate Adaptive Learning Path and check the ML-informed note.

## Milestone 3 Test Flow

1. Start MongoDB.
2. Start the FastAPI backend.
3. Run `python -m app.db.seed_data`.
4. Run `python -m app.db.seed_courses`.
5. Start the Expo frontend.
6. Register or log in.
7. Complete Career Assessment if needed.
8. Select a career path.
9. Open Course Recommendations.
10. Generate recommendations.
11. View reasons and relevance scores.
12. Save a course.
13. Open Saved Courses.
14. View course details.
15. Confirm MongoDB contains `courses`, `course_recommendations`, and `saved_courses`.

## Milestone 4 Test Flow

1. Start MongoDB.
2. Run the backend.
3. Start the frontend.
4. Register or log in.
5. Complete Career Assessment if needed.
6. Select a career path.
7. Generate course recommendations if needed.
8. Open Adaptive Learning Path.
9. Generate the adaptive learning path.
10. Open a phase and start a course.
11. Mark a course completed.
12. Confirm phase progress, next best course, and unlock logic update.
13. Confirm MongoDB contains `adaptive_learning_paths` and `learning_path_updates`.

## Milestone 5 Test Flow

1. Start MongoDB.
2. Run the backend on port 8000.
3. Start the Expo frontend.
4. Register or log in.
5. Generate an adaptive learning path if one does not already exist.
6. Open the Progress tab.
7. Open Course Progress and mark a course started or completed.
8. Confirm related skill progress updates after completion.
9. Open Study Activity and log minutes/tasks.
10. Confirm the weekly chart, streak, dashboard stats, and progress logs update.
11. Confirm MongoDB contains `user_course_progress`, `user_skill_progress`, `progress_logs`, and `study_activity_logs`.

## Milestone 6 Test Flow

1. Start MongoDB.
2. Run the backend on port 8000.
3. Start the Expo frontend.
4. Register or log in.
5. Complete Career Assessment if needed.
6. Select a career path.
7. Generate recommendations and an adaptive learning path if needed.
8. Complete some course progress if needed.
9. Open Skill Gap Analysis and run analysis.
10. Review mastered, weak, missing, and priority skills.
11. Open Missing Skills and save a recommended course.
12. Open Career Readiness and calculate the readiness score.
13. Review score level, breakdown, strengths, weaknesses, recommendations, and history.
14. Confirm MongoDB contains `skill_gap_analysis` and `career_readiness_scores`.

## Milestone 7 Test Flow

1. Start MongoDB.
2. Run the backend on port 8000.
3. Run `python -m app.db.seed_projects`.
4. Start the Expo frontend.
5. Register or log in.
6. Complete Career Assessment if needed.
7. Select a career path.
8. Open Suggested Projects.
9. Start a project.
10. Open Project Details and update progress.
11. Add GitHub and live demo links.
12. Mark the project completed.
13. Open My Projects.
14. Open Portfolio Readiness and calculate the checklist score.
15. Confirm MongoDB contains `projects`, `user_project_progress`, and `portfolio_readiness`.
