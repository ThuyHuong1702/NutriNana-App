#ai-backend/app/api/endpoints
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ai_service import detect_food
from app.db.mysql import get_db_connection
from pydantic import BaseModel
from typing import List
from app.db.mysql import get_db_connection
from app.services.ai_service import detect_food, interact_with_gemini
import json

router = APIRouter()
# Hàm này dùng chung cho cả Chat và Suggest
def get_user_profile_helper(firebase_id: str):
    """Hàm phụ trợ để lấy thông tin BMI, TDEE, GOAL từ DB"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql = "SELECT BMI, TDEE, GOAL_TYPE FROM USER_PROFILE WHERE FIREBASE_ID = %s"
        cursor.execute(sql, (firebase_id,))
        result = cursor.fetchone()
        
        if result:
            goal_mapping = {
                "lose": "giảm cân",
                "gain": "tăng cân",
                "maintain": "duy trì cân nặng"
            }
            return {
                "bmi": result.get('BMI', 'N/A'),
                "tdee": result.get('TDEE', 2000),
                "goal": goal_mapping.get(result.get('GOAL_TYPE'), "ăn uống lành mạnh")
            }
        # Fallback nếu chưa có profile
        return {"bmi": "N/A", "tdee": 2000, "goal": "ăn uống lành mạnh"}
    except Exception as e:
        print(f"Error getting profile: {e}")
        return {"bmi": "N/A", "tdee": 2000, "goal": "lỗi dữ liệu"}
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@router.get("/foods")
async def get_all_foods():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) 
        
        sql = "SELECT * FROM COOKED_FOOD WHERE DELETED_AT IS NULL"
        
        cursor.execute(sql)
        foods = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"success": True, "data": foods}
            
    except Exception as e:
        print(f"❌ Lỗi lấy món ăn: {e}")
        return {"success": False, "data": [], "error": str(e)}
    
# 2. API NHẬN DIỆN ẢNH (YOLO)
@router.post("/detect")
async def detect_ingredients(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File tải lên không phải là hình ảnh")
    
    try:
        contents = await file.read()
        ingredients = detect_food(contents)
        
        return {
            "success": True,
            "ingredients": ingredients
        }
    except Exception as e:
        print(f"❌ Lỗi nhận diện AI: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý hình ảnh: {str(e)}")

# 3. API GỢI Ý MÓN ĂN TỪ NGUYÊN LIỆU (GEMINI JSON)
class SuggestionRequest(BaseModel):
    firebase_id: str  
    ingredients: List[str]

@router.post("/suggest")
async def suggest_food(request: SuggestionRequest):
    try:
        # 1. Lấy profile (Dùng hàm helper)
        user_profile = get_user_profile_helper(request.firebase_id)

        # 2. Gọi hàm chung với tham số ingredients_list -> Trả về JSON
        ai_response = interact_with_gemini(
            user_profile=user_profile, 
            ingredients_list=request.ingredients
        )

        return {
            "success": True,
            # Frontend cần chuỗi JSON để parse
            "reply": json.dumps(ai_response) 
        }

    except Exception as e:
        print(f"❌ Lỗi API suggest: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. API CHAT BOT (GEMINI TEXT) - ĐÃ CẬP NHẬT
class ChatRequest(BaseModel):
    firebase_id: str 
    message: str

@router.post("/chat")
async def chat_bot(request: ChatRequest):
    try:
        user_profile = get_user_profile_helper(request.firebase_id)
        reply_text = interact_with_gemini(
            user_profile=user_profile, 
            user_message=request.message
        )
        
        return {"success": True, "reply": reply_text}
    except Exception as e:
        print(f"❌ Lỗi API Chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))