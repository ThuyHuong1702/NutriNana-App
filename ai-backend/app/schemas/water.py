# app/schemas/water.py
from pydantic import BaseModel
from typing import Optional, List

# --- Model cho API lấy danh sách yêu thích ---
class WaterFavoriteItem(BaseModel):
    FAV_ID: int
    W_ID: int
    DEFAULT_VOLUME: int
    DISPLAY_ORDER: int
    drink_name: str
    IMAGE_PATH: Optional[str] = None
    TRUE_WATER: float

class WaterFavoriteResponse(BaseModel):
    success: bool
    data: List[WaterFavoriteItem]
    message: Optional[str] = None

# --- Model cho API ghi nhật ký (Log Water) ---
class LogWaterRequest(BaseModel):
    uid: str          # Firebase UID
    w_id: int         # ID loại nước
    amount_ml: int    # Lượng uống
    date_str: str     # Ngày uống (YYYY-MM-DD)

class LogWaterResponse(BaseModel):
    success: bool
    message: str

class UpdateFavoriteRequest(BaseModel):
    uid: str
    old_w_id: int
    new_w_id: int
    new_volume: int