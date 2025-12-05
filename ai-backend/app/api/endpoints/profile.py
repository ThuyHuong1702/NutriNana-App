# app/api/endpoints/profile.py
from fastapi import APIRouter, HTTPException
import mysql.connector
from app.db.mysql import get_db_connection
from app.schemas.profile import OnboardingData
from app.services.calculator import calculate_metrics

router = APIRouter()

# 1. API Lưu Hồ Sơ
@router.post("/save-profile")
async def save_profile(data: OnboardingData):
    print(f"📥 Đang xử lý hồ sơ cho: {data.nickname}")
    
    # Bước 1: Tính toán
    metrics = calculate_metrics(data)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Bước 2: Lưu vào MySQL
        sql = """
        INSERT INTO user_profile (
            FIREBASE_ID, EMAIL, NICKNAME, CHARACTER_ID, 
            GOAL_TYPE, GENDER, DATE_OF_BIRTH, HEIGHT_CM, WEIGHT_KG, 
            LIFESTYLE_NAME, TARGET_WEIGHT_KG, TARGET_RATE_KG_PER_WEEK,
            BMI, BMR, TDEE, DAILY_CALORIE, DAILY_WATER_L
        ) VALUES (
            %s, %s, %s, %s, 
            %s, %s, %s, %s, %s, 
            %s, %s, %s,
            %s, %s, %s, %s, %s
        )
        ON DUPLICATE KEY UPDATE
            EMAIL=%s, NICKNAME=%s, CHARACTER_ID=%s, GOAL_TYPE=%s, 
            GENDER=%s, DATE_OF_BIRTH=%s, HEIGHT_CM=%s, WEIGHT_KG=%s,
            LIFESTYLE_NAME=%s, TARGET_WEIGHT_KG=%s, TARGET_RATE_KG_PER_WEEK=%s,
            BMI=%s, BMR=%s, TDEE=%s, DAILY_CALORIE=%s, DAILY_WATER_L=%s
        """
        
        # Gom dữ liệu (Insert)
        val_insert = (
            data.firebase_id, data.email, data.nickname, data.character_id,
            data.goal_type, data.gender, metrics['dob'], data.height, data.weight,
            metrics['lifestyle_name'], data.target_weight, data.weight_speed,
            metrics['bmi'], metrics['bmr'], metrics['tdee'], metrics['daily_calorie'], metrics['daily_water']
        )
        
        # Gom dữ liệu (Update)
        val_update = (
            data.email, data.nickname, data.character_id,
            data.goal_type, data.gender, metrics['dob'], data.height, data.weight,
            metrics['lifestyle_name'], data.target_weight, data.weight_speed,
            metrics['bmi'], metrics['bmr'], metrics['tdee'], metrics['daily_calorie'], metrics['daily_water']
        )

        cursor.execute(sql, val_insert + val_update)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return {
            "message": "Success", 
            "daily_calorie": metrics['daily_calorie'],
            "bmi": metrics['bmi']
        }

    except mysql.connector.Error as err:
        print(f"❌ Lỗi MySQL: {err}")
        raise HTTPException(status_code=500, detail=str(err))

# 2. API Lấy Hồ Sơ
@router.get("/get-profile/{firebase_uid}")
async def get_profile(firebase_uid: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        
        sql = "SELECT * FROM user_profile WHERE FIREBASE_ID = %s"
        cursor.execute(sql, (firebase_uid,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            # Xử lý ngày tháng để tránh lỗi JSON
            for key, value in result.items():
                if hasattr(value, 'isoformat'): 
                    result[key] = str(value)
                
            return {"success": True, "data": result}
        else:
            return {"success": False, "message": "User not found"}
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        return {"success": False, "message": str(e)}