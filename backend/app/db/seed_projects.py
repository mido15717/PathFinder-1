import asyncio
import re
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.db.indexes import create_indexes
from app.models.project_model import create_project_document
from app.models.base_model import utc_now


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _project(
    career: str,
    title: str,
    difficulty: str,
    skills: list[str],
    tools: list[str],
    weeks: int,
    description: str,
    features: list[str],
) -> dict[str, Any]:
    return {
        "title": title,
        "slug": _slug(f"{career}-{title}"),
        "description": description,
        "related_careers": [career],
        "difficulty": difficulty,
        "required_skills": skills,
        "tools": tools,
        "estimated_duration_weeks": weeks,
        "instructions": [
            "Define the user problem and project scope.",
            "Build the core feature set with clean structure.",
            "Document setup, usage, and design decisions in a README.",
            "Publish source code to GitHub and prepare portfolio notes.",
        ],
        "expected_output": f"A portfolio-ready {title} with source code, documentation, and a clear demo path.",
        "evaluation_criteria": [
            "Solves the stated problem clearly.",
            "Uses the required skills and tools appropriately.",
            "Includes readable code, README, and meaningful commits.",
            "Can be explained in an interview or portfolio review.",
        ],
        "suggested_features": features,
        "learning_outcomes": [
            f"Apply {skills[0]} in a realistic {career} context.",
            "Practice project scoping, implementation, testing, and documentation.",
            "Create evidence that supports career readiness.",
        ],
        "tags": [career, difficulty, *skills, *tools],
    }


PROJECTS: list[dict[str, Any]] = [
    _project("AI Engineer", "Image Classification App", "intermediate", ["Python", "Machine Learning", "Data Analysis"], ["Python", "TensorFlow", "FastAPI"], 3, "Train and serve an image classifier with a simple API or UI.", ["Upload an image", "Show prediction confidence", "Document dataset and model metrics"]),
    _project("AI Engineer", "Chatbot with NLP", "intermediate", ["Python", "NLP", "APIs"], ["Python", "Hugging Face", "FastAPI"], 3, "Build a chatbot that answers domain-specific questions.", ["Conversation history", "Intent handling", "Fallback responses"]),
    _project("AI Engineer", "Recommendation System", "advanced", ["Python", "Machine Learning", "Statistics"], ["Python", "Pandas", "Scikit-learn"], 4, "Create a recommendation engine for courses, movies, or products.", ["Similarity ranking", "User profile inputs", "Explain recommendations"]),
    _project("AI Engineer", "Model Deployment API", "advanced", ["Python", "Model Deployment", "FastAPI"], ["FastAPI", "Docker", "Python"], 3, "Deploy a trained model behind a production-style API.", ["Prediction endpoint", "Input validation", "Containerized deployment"]),
    _project("Machine Learning Engineer", "ML Pipeline Project", "advanced", ["Python", "Machine Learning", "MLOps"], ["Scikit-learn", "MLflow", "Docker"], 4, "Build a repeatable training and evaluation pipeline.", ["Data split", "Experiment tracking", "Model artifact export"]),
    _project("Machine Learning Engineer", "Model Evaluation Dashboard", "intermediate", ["Python", "Data Visualization", "Statistics"], ["Streamlit", "Pandas", "Scikit-learn"], 3, "Visualize model performance and compare experiments.", ["Metric charts", "Confusion matrix", "Model comparison table"]),
    _project("Machine Learning Engineer", "Feature Engineering Project", "intermediate", ["Python", "Data Analysis", "Machine Learning"], ["Pandas", "NumPy", "Scikit-learn"], 2, "Transform raw data into predictive features and compare results.", ["Before/after metrics", "Feature importance", "Reusable preprocessing"]),
    _project("Data Scientist", "Data Cleaning and Visualization Dashboard", "beginner", ["Python", "Data Analysis", "Data Visualization"], ["Pandas", "Plotly", "Streamlit"], 2, "Clean a messy dataset and publish an exploratory dashboard.", ["Missing value handling", "Interactive filters", "Insight summary"]),
    _project("Data Scientist", "Sales Prediction Model", "intermediate", ["Python", "Statistics", "Machine Learning"], ["Pandas", "Scikit-learn", "Jupyter"], 3, "Predict future sales from historical data.", ["Baseline model", "Evaluation metrics", "Business recommendations"]),
    _project("Data Scientist", "Customer Segmentation Project", "intermediate", ["Python", "Machine Learning", "Data Analysis"], ["Pandas", "Scikit-learn", "Matplotlib"], 3, "Cluster customers and explain segment behavior.", ["Cluster profiles", "Visualization", "Actionable segment strategy"]),
    _project("Backend Developer", "REST API with Authentication", "intermediate", ["Python", "FastAPI", "Authentication"], ["FastAPI", "JWT", "MongoDB"], 3, "Build a secure REST API with register/login and protected routes.", ["JWT auth", "CRUD resource", "Swagger documentation"]),
    _project("Backend Developer", "E-commerce Backend API", "advanced", ["FastAPI", "SQL", "Authentication"], ["FastAPI", "PostgreSQL", "Docker"], 4, "Create product, cart, order, and user APIs.", ["Product catalog", "Cart endpoints", "Order workflow"]),
    _project("Backend Developer", "Task Management API", "beginner", ["Python", "FastAPI", "MongoDB"], ["FastAPI", "MongoDB", "Postman"], 2, "Build a task CRUD API with validation and filtering.", ["Task CRUD", "Status filters", "Pagination"]),
    _project("Backend Developer", "MongoDB CRUD API", "beginner", ["Python", "MongoDB", "APIs"], ["FastAPI", "MongoDB", "Motor"], 2, "Create a clean MongoDB-backed CRUD service.", ["Async database access", "Indexes", "Error handling"]),
    _project("Frontend Developer", "Portfolio Website", "beginner", ["HTML/CSS", "JavaScript", "Git/GitHub"], ["React", "TypeScript", "Vite"], 2, "Build a polished personal portfolio website.", ["Project cards", "Responsive layout", "Contact section"]),
    _project("Frontend Developer", "Dashboard UI", "intermediate", ["React", "TypeScript", "Data Visualization"], ["React", "TypeScript", "Charts"], 3, "Create a responsive analytics dashboard.", ["Metric cards", "Charts", "Filter controls"]),
    _project("Frontend Developer", "E-commerce Frontend", "advanced", ["React", "TypeScript", "API Integration"], ["React", "TypeScript", "REST API"], 4, "Build a product browsing and cart frontend.", ["Product listing", "Cart state", "Checkout mock flow"]),
    _project("Frontend Developer", "API Integrated React App", "intermediate", ["React", "API Integration", "TypeScript"], ["React", "Axios", "TypeScript"], 3, "Build a React app that consumes and displays API data.", ["Search", "Loading/error states", "Detail view"]),
    _project("Mobile App Developer", "React Native Task App", "beginner", ["React Native", "TypeScript", "Mobile Navigation"], ["Expo", "React Native", "AsyncStorage"], 2, "Build a mobile task tracker with local persistence.", ["Task CRUD", "Filters", "Offline storage"]),
    _project("Mobile App Developer", "Mobile Learning Tracker", "intermediate", ["React Native", "TypeScript", "API Integration"], ["Expo", "React Navigation", "AsyncStorage"], 3, "Track learning goals, courses, and weekly progress in a mobile app.", ["Progress chart", "Goal cards", "Notifications placeholder"]),
    _project("Mobile App Developer", "Authentication Mobile App", "intermediate", ["React Native", "Authentication", "API Integration"], ["Expo", "JWT", "FastAPI"], 3, "Build a mobile auth flow connected to a backend API.", ["Login/register", "Token storage", "Profile screen"]),
    _project("Mobile App Developer", "API Connected Mobile Dashboard", "advanced", ["React Native", "API Integration", "Data Visualization"], ["Expo", "REST API", "Charts"], 4, "Display backend data in a mobile dashboard.", ["API service layer", "Refresh state", "Responsive cards"]),
    _project("Cybersecurity Analyst", "Vulnerability Report Project", "intermediate", ["Cybersecurity Basics", "Networks", "Documentation"], ["Nmap", "Linux", "Markdown"], 2, "Run a safe lab scan and write a professional vulnerability report.", ["Scan summary", "Risk ratings", "Remediation plan"]),
    _project("Cybersecurity Analyst", "OWASP Security Checklist App", "intermediate", ["Web Security", "OWASP", "JavaScript"], ["React", "OWASP", "Local Storage"], 3, "Build a checklist app for OWASP review tasks.", ["Checklist categories", "Status tracking", "Export summary"]),
    _project("Cybersecurity Analyst", "Log Analysis Mini Tool", "advanced", ["Python", "Incident Response", "Data Analysis"], ["Python", "Pandas", "Regex"], 3, "Parse logs and highlight suspicious patterns.", ["Log parser", "Alert rules", "Summary report"]),
    _project("Cloud Engineer", "Cloud Deployment Project", "intermediate", ["Cloud Basics", "Docker", "Networks"], ["AWS", "Docker", "Linux"], 3, "Deploy a small app to cloud infrastructure.", ["Deployment steps", "Environment config", "Health checks"]),
    _project("Cloud Engineer", "Serverless API", "advanced", ["Cloud Basics", "APIs", "Python"], ["AWS Lambda", "API Gateway", "Python"], 3, "Create a serverless API with storage integration.", ["HTTP endpoints", "Persistence", "Deployment notes"]),
    _project("Cloud Engineer", "Cloud Monitoring Dashboard", "advanced", ["Cloud Basics", "Monitoring", "Data Visualization"], ["CloudWatch", "Grafana", "Prometheus"], 4, "Build a dashboard for cloud service health.", ["Metrics panels", "Alerts", "Runbook notes"]),
    _project("DevOps Engineer", "CI/CD Pipeline Project", "intermediate", ["Git/GitHub", "CI/CD", "Docker"], ["GitHub Actions", "Docker", "YAML"], 3, "Automate test, build, and deployment steps.", ["Pipeline workflow", "Status badges", "Release artifact"]),
    _project("DevOps Engineer", "Dockerized Full-Stack App", "advanced", ["Docker", "Linux", "APIs"], ["Docker", "Docker Compose", "FastAPI"], 4, "Containerize a frontend, backend, and database stack.", ["Dockerfiles", "Compose file", "Setup guide"]),
    _project("DevOps Engineer", "Monitoring Stack Project", "advanced", ["Monitoring", "Linux", "Cloud Basics"], ["Prometheus", "Grafana", "Docker"], 4, "Create a local monitoring stack for an example service.", ["Metrics endpoint", "Dashboards", "Alert rules"]),
    _project("UI/UX Designer", "Mobile App Case Study", "beginner", ["UI/UX Design", "Wireframing", "Prototyping"], ["Figma", "FigJam", "Notion"], 2, "Design and document a mobile app UX case study.", ["Persona", "Wireframes", "Prototype"]),
    _project("UI/UX Designer", "Website Redesign Case Study", "intermediate", ["UI/UX Design", "Usability Testing", "HTML/CSS"], ["Figma", "Miro", "Lighthouse"], 3, "Audit and redesign an existing website experience.", ["Heuristic audit", "Before/after designs", "Testing notes"]),
    _project("UI/UX Designer", "Design System Project", "advanced", ["UI/UX Design", "Design Systems", "React"], ["Figma", "Storybook", "React"], 4, "Create reusable design tokens and component guidelines.", ["Color/type system", "Component library", "Usage docs"]),
]


async def seed_projects() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri, uuidRepresentation="standard")
    db = client[settings.database_name]
    await create_indexes(db)
    try:
        for payload in PROJECTS:
            career = await db.career_paths.find_one({"title": payload["related_careers"][0], "is_active": True})
            if not career:
                print(f"Skipping {payload['title']}: career {payload['related_careers'][0]} not found.")
                continue
            existing = await db.projects.find_one({"slug": payload["slug"]})
            document = create_project_document(payload, career["_id"])
            if existing:
                document["created_at"] = existing.get("created_at", document["created_at"])
                document["updated_at"] = utc_now()
                await db.projects.update_one({"_id": existing["_id"]}, {"$set": document})
            else:
                await db.projects.insert_one(document)
        print(f"Seeded {len(PROJECTS)} project templates.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_projects())
