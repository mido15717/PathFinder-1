# Project Description

PathFinder: Personalized Career and Learning Roadmaps for CS Students is a full-stack mobile-first platform for helping Computer Science students choose a career direction and follow a structured learning plan.

## Problem

CS students often face too many possible tracks: AI, data science, backend, frontend, mobile, cybersecurity, cloud, DevOps, and product design. They need guidance that connects their interests, academic stage, available study time, and current skills to a practical roadmap.

## Solution

PathFinder provides:

- Career exploration cards with required skills, tools, projects, and responsibilities.
- An AI-style career assessment that scores every career path, shows match percentages, recommends the best path, lists alternatives, and identifies strengths, weaknesses, and skills to improve.
- Personalized roadmap generation with phases, skills, courses, projects, and estimated duration.
- Progress Monitoring System: Track completed courses and update future recommendations based on learner progress.
- Skill completion tracking, roadmap progress summaries, course status tracking, and progress history over time.
- Profile management for academic year, university, career interest, and weekly study hours.
- Advanced graduation-project modules for skill tracking, project portfolio readiness, learning resources, weekly study planning, resume building, interview preparation, certifications, GitHub portfolio quality, reminders, and progress analytics.

## Technical Stack

- Frontend: Expo, React Native, TypeScript, React Navigation, Context API, AsyncStorage.
- Backend: FastAPI, MongoDB, Motor, Pydantic, JWT authentication.
- Documentation: Markdown docs for setup, API, and database schema.

## Progress Monitoring System

Progress monitoring is not only part of the recommendation algorithm itself. It is implemented at the full-system level using the frontend and database to track each student’s course completion and learning progress over time. Later, this tracked progress can be passed to the recommendation backend so the RAG/LLM module can adapt future course recommendations based on what the student has already completed.

Slide wording:

`Progress Monitoring System: Track completed courses and update future recommendations based on learner progress.`
