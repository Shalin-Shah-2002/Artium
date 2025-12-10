from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.generate import router as generate_router
from routes.articles import router as articles_router
from routes.auth import router as auth_router

app = FastAPI(title="AI Article Creator API", version="1.0.0")

# Configure CORS for Vite dev server
origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"ok": True, "message": "AI Article Creator API is running"}

# Include routers
app.include_router(generate_router, prefix="/api", tags=["generate"])
app.include_router(articles_router, prefix="/api", tags=["articles"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
