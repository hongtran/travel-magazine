from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import articles
from app.routers import pipeline
from app.auth import get_current_user_id
from app.config import settings

app = FastAPI(title="Travel Magazine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(articles.router)
app.include_router(pipeline.router)

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me")
def me(user_id: str = Depends(get_current_user_id)):
    return {"user_id": user_id}
