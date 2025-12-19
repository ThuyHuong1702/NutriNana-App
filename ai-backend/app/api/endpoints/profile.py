# app/api/endpoints/profile.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
import mysql.connector
from app.db.mysql import get_db_connection
from app.schemas.profile import OnboardingData
from app.services.calculator import calculate_metrics
import os
import shutil
import uuid
from pathlib import Path

router = APIRouter()

# Xác định đường dẫn gốc: ai-backend/app
BASE_DIR = Path(__file__).resolve().parent.parent.parent 

# Tạo đường dẫn lưu ảnh: ai-backend/app/uploads
UPLOAD_DIR = BASE_DIR / "uploads"

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

# 3. API Upload Avatar (Mới thêm vào)
@router.post("/upload-avatar")
async def upload_avatar(
    uid: str = Form(...),          # Nhận Firebase UID
    file: UploadFile = File(...),  # Nhận file ảnh
    db=Depends(get_db_connection)  # Dependency Injection
):
    # Lưu ý: Nếu hàm get_db_connection của bạn không trả về generator (yield), 
    # bạn có thể cần dùng: conn = get_db_connection() giống các hàm trên thay vì Depends.
    # Dưới đây viết theo style dùng Depends như bạn gửi:
    
    cursor = db.cursor(dictionary=True)
    try:
        # 1. Tạo tên file duy nhất
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uid}_{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # 2. Lưu file vào thư mục uploads
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Đường dẫn lưu DB
        db_image_path = f"uploads/{unique_filename}"

        # 4. Update DB
        cursor.execute("SELECT ID FROM user_profile WHERE FIREBASE_ID = %s", (uid,))
        user = cursor.fetchone()
        if not user:
            return {"success": False, "message": "User not found"}
            
        update_query = "UPDATE user_profile SET IMAGE_PATH = %s WHERE ID = %s"
        cursor.execute(update_query, (db_image_path, user['ID']))
        db.commit()

        return {
            "success": True, 
            "message": "Avatar updated", 
            "data": {"image_path": db_image_path}
        }

    except Exception as e:
        print(f"Error uploading avatar: {e}")
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        # db.close() # Nếu dùng Depends thì FastAPI thường tự xử lý, hoặc bạn tự đóng nếu cần

# 4. API Reset dữ liệu người dùng (Bắt đầu lại)
@router.delete("/reset-user-progress/{firebase_uid}")
async def reset_user_progress(firebase_uid: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Lấy ID nội bộ
        cursor.execute("SELECT ID FROM user_profile WHERE FIREBASE_ID = %s", (firebase_uid,))
        user = cursor.fetchone()
        
        if not user:
            return {"success": False, "message": "User not found"}
        
        user_id = user['ID']

        # 2. Xóa dữ liệu các bảng Log (Thứ tự quan trọng nếu có khóa ngoại)
        # Xóa lịch sử nước
        cursor.execute("DELETE FROM daily_water_log WHERE USER_ID = %s", (user_id,))
        
        # Xóa lịch sử ăn uống (Giả sử bạn có bảng này)
        cursor.execute("DELETE FROM daily_food_log WHERE USER_ID = %s", (user_id,))
        
        # Xóa lịch sử vận động (Giả sử bạn có bảng này)
        cursor.execute("DELETE FROM daily_activity_log WHERE USER_ID = %s", (user_id,))
        
        conn.commit()

        return {"success": True, "message": "User progress reset successfully"}

    except Exception as e:
        conn.rollback()
        print(f"Error resetting progress: {e}")
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        conn.close()
