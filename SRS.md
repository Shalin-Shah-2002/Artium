# SRS: AI Article Creator (React + FastAPI + MongoDB + Gemini)

## 1. Overview
- Purpose: Generate and edit AI-assisted articles tailored for Medium-style writing. Users input a title, tone, detail topics, and provide a Gemini API key. The app outputs editable sections and can export the final article as Markdown.
- Tech Stack:
  - Frontend: React (Vite)
  - Backend: FastAPI (Python)
  - DB: MongoDB (Atlas or local)
  - LLM: Google Gemini via user-provided API key
- Deployment: Local dev initially; Docker optional.

## 2. Goals and Non-Goals
- Goals:
  - Create articles from title + tone + details using Gemini.
  - Medium-style output with sections (intro, body sections, conclusion), headings, and suggested tags.
  - Inline editing of any section in the UI.
  - Save/load drafts to MongoDB.
  - Export final article as MD file.
- Non-Goals:
  - Built-in authentication system (initial version uses per-request API key).
  - Multi-user role management or publishing to Medium.

## 3. User Stories
- As a user, I can enter a title, tone, and detailed topics and generate an article.
- As a user, I can paste my Gemini API key and use it only for my session/request.
- As a user, I can edit any generated section in the UI before saving/exporting.
- As a user, I can save a draft and come back to edit it.
- As a user, I can export the final article as a Markdown file.
- As a user, I can see guidance on how to get a Gemini API key.

## 4. Functional Requirements
- FR1: Input form for title, tone (e.g., informative, persuasive, casual, professional), audience, length, and detailed topics/bullets.
- FR2: Validate presence of title and Gemini API key; optional fields for tone and topics.
- FR3: Generate article sections via FastAPI using Gemini:
  - Structure: title, intro, 3–7 body sections, conclusion, references (optional), tags.
  - Style: Medium-optimized tone, clarity, headings (H2/H3), short paragraphs, code blocks if technical.
- FR4: Frontend editor:
  - Edit individual sections inline.
  - Re-generate specific sections with updated prompts (optional).
- FR5: Draft management:
  - Create, update, load draft.
- FR6: Export to Markdown:
  - Include front matter (title, tags), headings, and content.
- FR7: API Key handling:
  - Passed from frontend per request.
  - Never stored server-side; optionally stored in localStorage on client with user consent.
- FR8: Error handling and user feedback:
  - Clear errors for invalid API key, rate limits, and backend issues.

## 5. Non-Functional Requirements
- NFR1: Performance: Initial generation under ~10s with streaming feedback (optional).
- NFR2: Security: Do not persist API keys in backend. CORS restrict to dev origins.
- NFR3: Reliability: Handle upstream API failures gracefully.
- NFR4: Maintainability: Clear separation of frontend and backend; typed models in backend.

## 6. Data Model (MongoDB)
- Collection: articles
  - _id: ObjectId
  - userId: string | null (future use)
  - title: string
  - tone: string
  - audience: string | null
  - topics: string[] | null
  - tags: string[]
  - sections: [
    { id: string, heading: string, content: string, order: number }
  ]
  - status: "draft" | "final"
  - createdAt: ISODate
  - updatedAt: ISODate
- Collection: generations (optional, for audit)
  - _id
  - articleId
  - prompt
  - model: "gemini-1.5-pro" (example)
  - meta: { tokens, latency }
  - createdAt

## 7. API Endpoints (FastAPI)
- POST /api/generate
  - Body: { title, tone?, audience?, topics?: string[], apiKey }
  - Returns: { article: { title, tags, sections[] } }
- POST /api/section/regenerate
  - Body: { article, sectionId, promptOverrides?, apiKey }
  - Returns: { section }
- POST /api/articles
  - Body: Full article object (without apiKey)
  - Returns: { _id }
- GET /api/articles/:id
  - Returns: Article document
- PUT /api/articles/:id
  - Body: Partial article updates
  - Returns: Updated article
- GET /api/health
  - Returns: { ok: true }

Notes:
- apiKey is only accepted on generation routes; not stored.
- CORS enabled for http://localhost:5173 (Vite dev server).

## 8. Frontend Views and Components
- GeneratorPage:
  - Form: title, tone (select), audience (text), topics (chips), API key (password field), “Generate” button.
  - Result: Section list with editable areas; actions: “Save Draft”, “Export MD”.
- SectionEditor:
  - Heading, content textarea/markdown editor.
  - “Regenerate Section” with optional prompt tweaks.
- DraftListPage (optional):
  - List saved drafts, open to edit.

## 9. Markdown Export Format
- Front matter (YAML):
  - title, tags
- Headings:
  - H1: Title
  - H2/H3: Sections
- Optional code blocks and lists preserved.

## 10. Gemini API Usage
- Model: Gemini 1.5 Pro (or latest text-capable model).
- Prompt template:
  - System/style: “Write a Medium-style article...”
  - Inputs: title, tone, audience, topics, desired section count.
  - Output format: JSON with fields { title, tags, sections: [{ heading, content }] }.
- Safety:
  - Filter harmful requests; reject content per policy.

## 11. How Users Obtain a Gemini API Key
- Steps:
  1. Visit https://ai.google.dev/
  2. Sign in with a Google account.
  3. Go to “Get API key” under “Google AI Studio”.
  4. Create a new API key and copy it.
  5. Keep it secure; set usage limits if available.
- In-app:
  - Paste the key in the “Gemini API Key” field.
  - Key is sent only to backend for the generation request and not stored.

## 12. Environment and Config
- Backend .env:
  - MONGODB_URI=mongodb+srv://...
  - CORS_ORIGINS=http://localhost:5173
- Frontend:
  - Vite proxy for /api -> http://127.0.0.1:8000
- No server-side Gemini key persisted.

## 13. Error Cases
- Invalid API key: 401 with message “Invalid Gemini API key.”
- Rate limit: 429 with “Rate limited by Gemini.”
- Missing title: 400.
- DB connectivity: 500 with message.

## 14. Testing
- Backend: pytest for endpoints; mock Gemini client.
- Frontend: Vitest + React Testing Library for form and editor.

## 15. Future Enhancements
- Auth with JWT, user accounts.
- Streaming generation and progress UI.
- Templates for different article types.
- Integrations: Publish to Medium via API.
