from pydantic import BaseModel
from typing import Optional

class FoodLogItem(BaseModel):
    firebase_id: str
    food_id: int
    meal_label: str     # "Sáng", "Trưa", "Tối", "Phụ" (hoặc "Vận động")
    quantity: float
    log_date: str       # YYYY-MM-DD
    
    # Thông tin dinh dưỡng
    calories: float
    protein: float
    carb: float
    fat: float