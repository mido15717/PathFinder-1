# Setup Guide

## Prerequisites

- Node.js and npm
- Python 3.11+
- MongoDB 7+ running locally or in MongoDB Atlas
- Expo Go or an Android/iOS emulator

## Frontend

```powershell
cd PathFinder\frontend
npm install
npx expo start
```

## Backend

```powershell
cd PathFinder\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python -m app.db.seed_data
uvicorn app.main:app --reload
```

For local MongoDB with Docker:

```powershell
docker run --name pathfinder-mongo -p 27017:27017 -d mongo:7
```

If Docker is unavailable, install MongoDB Community Server and make sure `MONGODB_URI` in `.env` points to your running MongoDB instance.

## Connect Frontend to Backend

```powershell
cd PathFinder\frontend
$env:EXPO_PUBLIC_API_MODE='backend'
$env:EXPO_PUBLIC_API_BASE_URL='http://localhost:8000'
npx expo start
```

For a physical phone, replace `localhost` with your computer's LAN IP address.

## Demo Account

The mock frontend mode accepts any valid email and a password with at least six characters. Backend mode requires registration first.
