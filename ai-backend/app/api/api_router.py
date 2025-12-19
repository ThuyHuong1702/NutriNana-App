# app/api/api_router.py
from fastapi import APIRouter
from app.api.endpoints import profile, food, food_log, activities, summary, water

api_router = APIRouter()

api_router.include_router(profile.router, prefix="/api", tags=["profile"])
api_router.include_router(food.router, prefix="/api", tags=["food"])
api_router.include_router(food_log.router, prefix="/api", tags=["log"])
api_router.include_router(activities.router, prefix="/api", tags=["Activities"])
api_router.include_router(summary.router, prefix="/api", tags=["Summary"])
api_router.include_router(water.router, tags=["water"], prefix="/api")