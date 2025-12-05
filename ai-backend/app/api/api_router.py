# app/api/api_router.py
from fastapi import APIRouter
from app.api.endpoints import profile

api_router = APIRouter()

# Nhúng router profile vào, thêm tiền tố /api
api_router.include_router(profile.router, prefix="/api", tags=["profile"])