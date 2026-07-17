import os

for dotenv in [".env", "../.env"]:
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), dotenv)
    if os.path.isfile(p):
        with open(p) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth_router, devotional_router, journal_router, prayer_router, progress_router, chatbot_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Na Tua Presenca",
    description="365 dias com Deus - API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(devotional_router.router)
app.include_router(journal_router.router)
app.include_router(prayer_router.router)
app.include_router(progress_router.router)
app.include_router(chatbot_router.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}

static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
