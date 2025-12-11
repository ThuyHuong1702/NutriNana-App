from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # 1. Import cái này
import os
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

# 2. MỞ KHO ẢNH (MOUNT STATIC FILES)
# Logic: Khi ai đó gọi đường dẫn bắt đầu bằng "/food_images", 
# hãy tìm file trong thư mục "app/food_images"
# Lưu ý: Đảm bảo thư mục app/food_images có tồn tại
if not os.path.exists("app/food_images"):
    os.makedirs("app/food_images")

app.mount("/food_images", StaticFiles(directory="app/food_images"), name="food_images")

# Nhúng Router
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "NutriNana API is running!"}