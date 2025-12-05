# ai-backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_router import api_router

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nhúng Router tổng vào App
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "NutriNana API is running successfully with Modular Structure! 🚀"}