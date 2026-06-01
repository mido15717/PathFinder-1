from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from app.api.routes import assessments, auth, careers, certifications, courses, interviews, learning_paths, matches, ml_predictions, portfolio, profiles, progress, projects, readiness, recommendations, resumes, skill_gap, users
from app.core.config import settings
from app.db.indexes import create_indexes
from app.db.mongodb import close_mongo_connection, connect_to_mongo, get_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.database_connected = False
    try:
        await connect_to_mongo()
        await create_indexes(get_database())
        app.state.database_connected = True
    except Exception as exc:
        app.state.database_connected = False
        print(f"MongoDB connection failed: {exc}")
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="PathFinder API for auth, career matching, and course recommendations.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=".*" if settings.debug else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str | bool]:
    return {"status": "ok", "service": settings.app_name, "database_connected": bool(getattr(app.state, "database_connected", False))}


@app.exception_handler(PyMongoError)
async def database_exception_handler(request: Request, exc: PyMongoError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"detail": "Database is unavailable. Please make sure MongoDB is running and try again."},
    )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(careers.router)
app.include_router(assessments.router)
app.include_router(matches.router)
app.include_router(ml_predictions.router)
app.include_router(courses.router)
app.include_router(recommendations.router)
app.include_router(learning_paths.router)
app.include_router(progress.router)
app.include_router(skill_gap.router)
app.include_router(readiness.router)
app.include_router(projects.router)
app.include_router(portfolio.router)
app.include_router(resumes.router)
app.include_router(interviews.router)
app.include_router(certifications.router)
