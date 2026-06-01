import asyncio
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.db.indexes import create_indexes
from app.models.interview_model import create_interview_question_document
from app.models.base_model import utc_now


CAREER_SKILLS: dict[str, list[str]] = {
    "AI Engineer": ["Python", "Machine Learning", "NLP", "Model Deployment"],
    "Machine Learning Engineer": ["Python", "MLOps", "Feature Engineering", "Model Evaluation"],
    "Data Scientist": ["Python", "SQL", "Statistics", "Data Visualization"],
    "Backend Developer": ["FastAPI", "Authentication", "MongoDB", "API Design"],
    "Frontend Developer": ["React", "TypeScript", "Accessibility", "API Integration"],
    "Mobile App Developer": ["React Native", "Expo", "Mobile Navigation", "Offline Storage"],
    "Cybersecurity Analyst": ["Networks", "OWASP", "Incident Response", "Log Analysis"],
    "Cloud Engineer": ["AWS", "Docker", "Networking", "Monitoring"],
    "DevOps Engineer": ["CI/CD", "Docker", "Linux", "Infrastructure as Code"],
    "UI/UX Designer": ["Figma", "Wireframing", "Usability Testing", "Design Systems"],
}

QUESTION_TEMPLATES: list[dict[str, Any]] = [
    {
        "type": "technical",
        "difficulty": "beginner",
        "skill_index": 0,
        "question": "Explain the role of {skill} in day-to-day {career} work.",
        "sample_answer": "A strong answer defines the concept clearly, connects it to common work in the role, and gives a small practical example.",
    },
    {
        "type": "technical",
        "difficulty": "intermediate",
        "skill_index": 1,
        "question": "How would you troubleshoot a project where {skill} results are not matching expectations?",
        "sample_answer": "Describe checking inputs, assumptions, logs or metrics, then isolating one variable at a time before validating a fix.",
    },
    {
        "type": "coding",
        "difficulty": "beginner",
        "skill_index": 0,
        "question": "Write or outline a small function that validates input before using it in a {career} project.",
        "sample_answer": "Mention clear parameters, guard clauses, useful error messages, and a simple success path.",
    },
    {
        "type": "coding",
        "difficulty": "intermediate",
        "skill_index": 2,
        "question": "Design a small workflow that uses {skill} and explain the data flow from input to output.",
        "sample_answer": "A good answer names each step, explains validation and failure handling, and shows how results are returned or displayed.",
    },
    {
        "type": "coding",
        "difficulty": "advanced",
        "skill_index": 3,
        "question": "How would you scale or harden a {career} solution that depends on {skill}?",
        "sample_answer": "Discuss modular design, observability, testing, security, performance, and a rollback or recovery plan.",
    },
    {
        "type": "behavioral",
        "difficulty": "beginner",
        "skill_index": 0,
        "question": "Tell me about a time you learned a new technical skill for a project.",
        "sample_answer": "Use STAR: situation, task, action, result. Include what you learned and how you applied it.",
    },
    {
        "type": "behavioral",
        "difficulty": "intermediate",
        "skill_index": 1,
        "question": "Describe a time you received feedback on your work and improved the outcome.",
        "sample_answer": "Show openness, specific actions taken, and a measurable or observable improvement.",
    },
    {
        "type": "behavioral",
        "difficulty": "advanced",
        "skill_index": 2,
        "question": "How would you communicate tradeoffs in a {career} project to a non-technical stakeholder?",
        "sample_answer": "Frame tradeoffs in user impact, risk, cost, and timeline, then recommend a clear next step.",
    },
]


def _questions_for(career: str, skills: list[str]) -> list[dict[str, Any]]:
    questions = []
    for template in QUESTION_TEMPLATES:
        skill = skills[template["skill_index"] % len(skills)]
        questions.append(
            {
                "question": template["question"].format(career=career, skill=skill),
                "sample_answer": template["sample_answer"],
                "type": template["type"],
                "difficulty": template["difficulty"],
                "related_skill": skill,
                "tags": [career, skill, template["type"], template["difficulty"]],
            }
        )
    return questions


async def seed_interviews() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri, uuidRepresentation="standard")
    db = client[settings.database_name]
    await create_indexes(db)
    try:
        total = 0
        for career_title, skills in CAREER_SKILLS.items():
            career = await db.career_paths.find_one({"title": career_title, "is_active": True})
            if not career:
                print(f"Skipping interview questions for {career_title}: career path not found.")
                continue
            for payload in _questions_for(career_title, skills):
                existing = await db.interview_questions.find_one({"career_path_id": career["_id"], "question": payload["question"]})
                document = create_interview_question_document(payload, career["_id"], career_title)
                if existing:
                    document["created_at"] = existing.get("created_at", document["created_at"])
                    document["updated_at"] = utc_now()
                    await db.interview_questions.update_one({"_id": existing["_id"]}, {"$set": document})
                else:
                    await db.interview_questions.insert_one(document)
                total += 1
        print(f"Seeded {total} interview questions.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_interviews())
