# app/schemas/water.py
from pydantic import BaseModel
from typing import Optional, List

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

class LogWaterRequest(BaseModel):
    uid: str          
    w_id: int         
    amount_ml: int    
    date_str: str     

class LogWaterResponse(BaseModel):
    success: bool
    message: str

class UpdateFavoriteRequest(BaseModel):
    uid: str
    old_w_id: int
    new_w_id: int
    new_volume: int