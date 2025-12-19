# app/schemas/profile.py
from pydantic import BaseModel

class OnboardingData(BaseModel):
    firebase_id: str
    email: str
    nickname: str
    character_id: str
    gender: str         
    age: int
    height: float        # cm
    weight: float        # kg
    activity_level: float # 1.2, 1.375...
    goal_type: str       # 'lose', 'maintain', 'gain'
    target_weight: float
    weight_speed: float  # kg/week