import asyncio
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.db.indexes import create_indexes
from app.models.certification_model import create_certification_document
from app.models.base_model import utc_now


CERTIFICATIONS: list[dict[str, Any]] = [
    {"career": "AI Engineer", "title": "DeepLearning.AI Machine Learning Specialization", "provider": "DeepLearning.AI", "difficulty": "intermediate", "skills": ["Machine Learning", "Python", "Model Evaluation"]},
    {"career": "AI Engineer", "title": "Google Machine Learning Crash Course", "provider": "Google", "difficulty": "beginner", "skills": ["Machine Learning", "TensorFlow"]},
    {"career": "AI Engineer", "title": "Generative AI with Large Language Models", "provider": "DeepLearning.AI", "difficulty": "advanced", "skills": ["NLP", "LLMs", "AI Systems"]},
    {"career": "Machine Learning Engineer", "title": "Machine Learning Engineering for Production", "provider": "DeepLearning.AI", "difficulty": "advanced", "skills": ["MLOps", "Model Deployment"]},
    {"career": "Machine Learning Engineer", "title": "AWS Certified Machine Learning Specialty", "provider": "AWS", "difficulty": "advanced", "skills": ["AWS", "Machine Learning", "Deployment"]},
    {"career": "Machine Learning Engineer", "title": "DataCamp Machine Learning Scientist", "provider": "DataCamp", "difficulty": "intermediate", "skills": ["Python", "Scikit-learn", "Feature Engineering"]},
    {"career": "Data Scientist", "title": "IBM Data Science Professional Certificate", "provider": "IBM", "difficulty": "beginner", "skills": ["Python", "Data Analysis", "SQL"]},
    {"career": "Data Scientist", "title": "Google Data Analytics Certificate", "provider": "Google", "difficulty": "beginner", "skills": ["Analytics", "Data Visualization"]},
    {"career": "Data Scientist", "title": "Microsoft Power BI Data Analyst", "provider": "Microsoft", "difficulty": "intermediate", "skills": ["Power BI", "Data Modeling"]},
    {"career": "Backend Developer", "title": "Meta Back-End Developer Certificate", "provider": "Meta", "difficulty": "intermediate", "skills": ["APIs", "Databases", "Backend"]},
    {"career": "Backend Developer", "title": "MongoDB Python Developer Path", "provider": "MongoDB", "difficulty": "intermediate", "skills": ["MongoDB", "Python"]},
    {"career": "Backend Developer", "title": "Postman API Fundamentals Student Expert", "provider": "Postman", "difficulty": "beginner", "skills": ["API Testing", "REST"]},
    {"career": "Frontend Developer", "title": "Meta Front-End Developer Certificate", "provider": "Meta", "difficulty": "beginner", "skills": ["React", "JavaScript", "HTML/CSS"]},
    {"career": "Frontend Developer", "title": "freeCodeCamp Front End Development Libraries", "provider": "freeCodeCamp", "difficulty": "intermediate", "skills": ["React", "Bootstrap", "Sass"]},
    {"career": "Frontend Developer", "title": "Google UX Design Foundations for Frontend", "provider": "Google", "difficulty": "beginner", "skills": ["UI", "Accessibility"]},
    {"career": "Mobile App Developer", "title": "Meta React Native Specialization", "provider": "Meta", "difficulty": "intermediate", "skills": ["React Native", "Mobile Development"]},
    {"career": "Mobile App Developer", "title": "Android Basics with Compose", "provider": "Google", "difficulty": "beginner", "skills": ["Android", "Mobile UI"]},
    {"career": "Mobile App Developer", "title": "Expo React Native Fundamentals", "provider": "Expo", "difficulty": "beginner", "skills": ["Expo", "React Native"]},
    {"career": "Cybersecurity Analyst", "title": "Google Cybersecurity Certificate", "provider": "Google", "difficulty": "beginner", "skills": ["Security", "Linux", "Networks"]},
    {"career": "Cybersecurity Analyst", "title": "CompTIA Security+", "provider": "CompTIA", "difficulty": "intermediate", "skills": ["Security", "Risk", "Networks"]},
    {"career": "Cybersecurity Analyst", "title": "Cisco CyberOps Associate", "provider": "Cisco", "difficulty": "intermediate", "skills": ["SOC", "Incident Response"]},
    {"career": "Cloud Engineer", "title": "AWS Certified Cloud Practitioner", "provider": "AWS", "difficulty": "beginner", "skills": ["AWS", "Cloud Basics"]},
    {"career": "Cloud Engineer", "title": "Microsoft Azure Fundamentals AZ-900", "provider": "Microsoft", "difficulty": "beginner", "skills": ["Azure", "Cloud Basics"]},
    {"career": "Cloud Engineer", "title": "Google Associate Cloud Engineer", "provider": "Google Cloud", "difficulty": "intermediate", "skills": ["Cloud Deployment", "Monitoring"]},
    {"career": "DevOps Engineer", "title": "Docker Foundations Professional Certificate", "provider": "Docker", "difficulty": "beginner", "skills": ["Docker", "Containers"]},
    {"career": "DevOps Engineer", "title": "GitHub Actions Certification", "provider": "GitHub", "difficulty": "intermediate", "skills": ["CI/CD", "Automation"]},
    {"career": "DevOps Engineer", "title": "HashiCorp Terraform Associate", "provider": "HashiCorp", "difficulty": "intermediate", "skills": ["Terraform", "Infrastructure as Code"]},
    {"career": "UI/UX Designer", "title": "Google UX Design Certificate", "provider": "Google", "difficulty": "beginner", "skills": ["UX Research", "Wireframing"]},
    {"career": "UI/UX Designer", "title": "Interaction Design Foundation UX Courses", "provider": "Interaction Design Foundation", "difficulty": "intermediate", "skills": ["Usability", "Interaction Design"]},
    {"career": "UI/UX Designer", "title": "Figma UI Design Essentials", "provider": "Figma", "difficulty": "beginner", "skills": ["Figma", "Prototyping"]},
]


def _payload(raw: dict[str, Any]) -> dict[str, Any]:
    return {
        "title": raw["title"],
        "provider": raw["provider"],
        "description": f"{raw['title']} helps validate skills for the {raw['career']} path.",
        "difficulty": raw["difficulty"],
        "url": "",
        "estimated_duration": "4-12 weeks",
        "cost_type": "mixed",
        "related_skills": raw["skills"],
        "is_active": True,
    }


async def seed_certifications() -> None:
    client = AsyncIOMotorClient(settings.mongo_uri, uuidRepresentation="standard")
    db = client[settings.database_name]
    await create_indexes(db)
    try:
        total = 0
        for raw in CERTIFICATIONS:
            career = await db.career_paths.find_one({"title": raw["career"], "is_active": True})
            if not career:
                print(f"Skipping {raw['title']}: career path {raw['career']} not found.")
                continue
            payload = _payload(raw)
            existing = await db.certifications.find_one({"career_path_id": career["_id"], "title": payload["title"], "provider": payload["provider"]})
            document = create_certification_document(payload, career["_id"], raw["career"])
            if existing:
                document["created_at"] = existing.get("created_at", document["created_at"])
                document["updated_at"] = utc_now()
                await db.certifications.update_one({"_id": existing["_id"]}, {"$set": document})
            else:
                await db.certifications.insert_one(document)
            total += 1
        print(f"Seeded {total} certifications.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed_certifications())
