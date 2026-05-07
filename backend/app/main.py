from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.subtasks import router as subtasks_router
from app.api.tasks import router as tasks_router
from app.core.config import settings
from app.core.scheduler import create_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = create_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(tasks_router)
app.include_router(subtasks_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


