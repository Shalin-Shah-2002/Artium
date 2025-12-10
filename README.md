# Artium

Artium is a full-stack writing studio that pairs a React (Vite) frontend with a FastAPI backend to craft Medium-ready longform articles powered by Google Gemini. It blends AI-assisted generation, intuitive editing, and authenticated draft management in a single workspace.

## Project Structure

```
.
├── frontend/          # Artium client (React + Vite)
└── backend/           # FastAPI API surface
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

The backend will be available at http://localhost:8000
- API Documentation (Swagger): http://localhost:8000/docs
- API Documentation (ReDoc): http://localhost:8000/redoc

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Running Both Servers

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Features

- ✨ Gemini-powered article generation tuned for Medium formatting
- 🗂️ Authenticated draft management with MongoDB Atlas persistence
- 🖊️ Section-level editing and regeneration with Markdown-aware previews
- 📋 One-click “Copy for Medium” clipboard integration (HTML + Markdown)
- 🎨 Custom PAYROT-inspired glassmorphism UI with responsive layout
- ⚡️ Fast iteration via Vite, React 18, and hot module replacement

## Tech Stack

**Frontend**
- React 18 + Vite
- Custom CSS / glassmorphism theme

**Backend**
- FastAPI + Pydantic
- Google Gemini client
- MongoDB Atlas

**Tooling**
- JWT auth, bcrypt, passlib
- ESLint 9, modern React hooks

## Development Notes

- Frontend source lives in `frontend/src/`
- Backend API lives in `backend/`
- During development Vite proxies `/api` to the FastAPI server running on `http://localhost:8000`
