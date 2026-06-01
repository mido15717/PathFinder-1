import asyncio
import re
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.db.indexes import create_indexes
from app.models.course_model import create_course_document
from app.models.base_model import utc_now

CAREER_COURSE_TOPICS: dict[str, dict[str, Any]] = {
    "AI Engineer": {
        "skills": ["Python", "Machine Learning", "Mathematics", "Statistics", "Model Deployment"],
        "subjects": ["Artificial Intelligence", "Mathematics", "Statistics", "Algorithms"],
        "topics": [
            ("Python Basics for AI", "beginner", "course", "Coursera"),
            ("Mathematics for Machine Learning", "beginner", "video", "Khan Academy"),
            ("Machine Learning Basics", "intermediate", "course", "DeepLearning.AI"),
            ("NLP Basics", "intermediate", "tutorial", "Hugging Face"),
            ("Deep Learning Fundamentals", "advanced", "course", "DeepLearning.AI"),
            ("Model Deployment for AI APIs", "advanced", "project", "PathFinder Lab"),
        ],
    },
    "Machine Learning Engineer": {
        "skills": ["Python", "Machine Learning", "Data Analysis", "SQL", "MLOps"],
        "subjects": ["Artificial Intelligence", "Statistics", "Databases", "Mathematics"],
        "topics": [
            ("Python for Machine Learning", "beginner", "course", "freeCodeCamp"),
            ("Statistics Fundamentals for ML", "beginner", "article", "Khan Academy"),
            ("Scikit-learn Projects", "intermediate", "project", "DataCamp"),
            ("ML Model Evaluation", "intermediate", "tutorial", "Google"),
            ("MLOps Pipeline Fundamentals", "advanced", "course", "DeepLearning.AI"),
            ("Production Model Monitoring", "advanced", "documentation", "MLflow"),
        ],
    },
    "Data Scientist": {
        "skills": ["Python", "SQL", "Statistics", "Data Analysis", "Data Visualization"],
        "subjects": ["Statistics", "Mathematics", "Databases", "Artificial Intelligence"],
        "topics": [
            ("Python for Data Analysis", "beginner", "course", "DataCamp"),
            ("SQL for Data Science", "beginner", "course", "Mode"),
            ("Pandas and NumPy", "intermediate", "tutorial", "Kaggle"),
            ("Data Visualization Projects", "intermediate", "project", "Tableau"),
            ("Statistics for Data Science", "advanced", "book", "OpenIntro"),
            ("Power BI Dashboard Projects", "advanced", "project", "Microsoft Learn"),
        ],
    },
    "Backend Developer": {
        "skills": ["Python", "FastAPI", "SQL", "MongoDB", "Docker"],
        "subjects": ["Programming", "Databases", "Data Structures", "Algorithms"],
        "topics": [
            ("Python Backend with FastAPI", "beginner", "course", "Udemy"),
            ("REST API Design", "beginner", "article", "Microsoft Learn"),
            ("MongoDB for Backend Developers", "intermediate", "course", "MongoDB University"),
            ("Authentication with JWT", "intermediate", "tutorial", "Auth0"),
            ("Docker Basics for APIs", "advanced", "course", "Docker"),
            ("Backend Deployment Project", "advanced", "project", "PathFinder Lab"),
        ],
    },
    "Frontend Developer": {
        "skills": ["HTML/CSS", "JavaScript", "TypeScript", "React", "API Integration"],
        "subjects": ["Web Development", "Programming", "Human Computer Interaction", "Algorithms"],
        "topics": [
            ("HTML and CSS Foundations", "beginner", "course", "freeCodeCamp"),
            ("JavaScript Fundamentals", "beginner", "video", "MDN"),
            ("TypeScript Basics", "intermediate", "documentation", "TypeScript"),
            ("React Fundamentals", "intermediate", "course", "Meta"),
            ("State Management and API Integration", "advanced", "tutorial", "Frontend Masters"),
            ("Frontend Testing Essentials", "advanced", "course", "Testing Library"),
        ],
    },
    "Mobile App Developer": {
        "skills": ["React Native", "JavaScript", "TypeScript", "AsyncStorage", "Mobile Navigation"],
        "subjects": ["Mobile Development", "Programming", "Human Computer Interaction", "Databases"],
        "topics": [
            ("React Native Basics", "beginner", "course", "Expo"),
            ("Expo Fundamentals", "beginner", "documentation", "Expo"),
            ("Mobile Navigation Patterns", "intermediate", "tutorial", "React Navigation"),
            ("AsyncStorage and Local State", "intermediate", "article", "React Native"),
            ("API Integration in React Native", "advanced", "project", "PathFinder Lab"),
            ("Mobile App Deployment", "advanced", "course", "Expo"),
        ],
    },
    "Cybersecurity Analyst": {
        "skills": ["Cybersecurity Basics", "Networks", "Linux", "Web Security", "Incident Response"],
        "subjects": ["Security", "Networks", "Programming", "Databases"],
        "topics": [
            ("Cybersecurity Basics", "beginner", "course", "Google"),
            ("Networking Fundamentals", "beginner", "course", "Cisco"),
            ("Linux Basics for Security", "intermediate", "tutorial", "Linux Foundation"),
            ("OWASP Top 10", "intermediate", "documentation", "OWASP"),
            ("SOC Analyst Basics", "advanced", "course", "TryHackMe"),
            ("Incident Response Lab", "advanced", "project", "Blue Team Labs"),
        ],
    },
    "Cloud Engineer": {
        "skills": ["Cloud Basics", "AWS", "Networks", "Docker", "Infrastructure"],
        "subjects": ["Networks", "Databases", "Programming", "Security"],
        "topics": [
            ("Cloud Computing Basics", "beginner", "course", "AWS"),
            ("AWS Cloud Practitioner", "beginner", "platform", "AWS Skill Builder"),
            ("Docker Fundamentals", "intermediate", "course", "Docker"),
            ("Infrastructure Basics", "intermediate", "article", "HashiCorp"),
            ("Cloud Deployment Project", "advanced", "project", "PathFinder Lab"),
            ("Monitoring Cloud Services", "advanced", "tutorial", "Google Cloud"),
        ],
    },
    "DevOps Engineer": {
        "skills": ["Git/GitHub", "Docker", "CI/CD", "Kubernetes", "Linux"],
        "subjects": ["Networks", "Programming", "Security", "Databases"],
        "topics": [
            ("Linux for DevOps", "beginner", "course", "Linux Foundation"),
            ("GitHub Actions Basics", "beginner", "tutorial", "GitHub"),
            ("CI/CD Pipelines", "intermediate", "course", "GitLab"),
            ("Docker Fundamentals for DevOps", "intermediate", "course", "Docker"),
            ("Kubernetes Basics", "advanced", "course", "CNCF"),
            ("Monitoring with Prometheus", "advanced", "documentation", "Prometheus"),
        ],
    },
    "UI/UX Designer": {
        "skills": ["UI/UX Design", "Figma", "Wireframing", "Prototyping", "Usability Testing"],
        "subjects": ["Human Computer Interaction", "Web Development", "Mobile Development", "Programming"],
        "topics": [
            ("UI Design Principles", "beginner", "course", "Interaction Design Foundation"),
            ("UX Research Basics", "beginner", "article", "Nielsen Norman Group"),
            ("Figma Fundamentals", "intermediate", "tutorial", "Figma"),
            ("Wireframing and Prototyping", "intermediate", "project", "Coursera"),
            ("Design Systems", "advanced", "course", "Figma"),
            ("Portfolio Case Studies", "advanced", "project", "PathFinder Lab"),
        ],
    },
}


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def build_course_seed() -> list[dict[str, Any]]:
    courses: list[dict[str, Any]] = []
    hours_by_difficulty = {"beginner": 8, "intermediate": 16, "advanced": 28}
    rating_by_difficulty = {"beginner": 4.4, "intermediate": 4.6, "advanced": 4.7}
    for career, config in CAREER_COURSE_TOPICS.items():
        for title, difficulty, course_type, provider in config["topics"]:
            primary_skill = config["skills"][0]
            secondary_skills = config["skills"][1:4]
            url = f"https://example.com/pathfinder/{_slug(provider)}/{_slug(title)}"
            courses.append(
                {
                    "title": title,
                    "description": f"{title} for students preparing for the {career} path.",
                    "provider": provider,
                    "url": url,
                    "course_type": course_type,
                    "difficulty": difficulty,
                    "estimated_hours": hours_by_difficulty[difficulty],
                    "is_free": provider in {"freeCodeCamp", "MDN", "Khan Academy", "OWASP", "Expo", "GitHub", "Prometheus"},
                    "rating": rating_by_difficulty[difficulty],
                    "language": "English",
                    "related_careers": [career],
                    "related_skills": [primary_skill, *secondary_skills],
                    "related_subjects": config["subjects"],
                    "tags": [career, difficulty, course_type, *config["skills"]],
                    "prerequisites": ["Basic computer science foundations"] if difficulty != "beginner" else [],
                    "learning_outcomes": [
                        f"Understand core {primary_skill} concepts.",
                        f"Apply {secondary_skills[0]} in a practical {career} context.",
                        "Build a portfolio-ready learning artifact.",
                    ],
                    "source_dataset": "PathFinder Milestone 3 seed courses",
                }
            )
    return courses


COURSES = build_course_seed()


async def seed_courses() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri, uuidRepresentation="standard")
    db = client[settings.database_name]
    await create_indexes(db)
    try:
        for payload in COURSES:
            existing = await db.courses.find_one({"title": payload["title"], "provider": payload["provider"]})
            document = create_course_document(payload)
            if existing:
                document["created_at"] = existing.get("created_at", document["created_at"])
                document["updated_at"] = utc_now()
                await db.courses.update_one({"_id": existing["_id"]}, {"$set": document})
            else:
                await db.courses.insert_one(document)
        print(f"Seeded {len(COURSES)} courses/resources.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_courses())
