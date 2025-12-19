#ai-backend/app/api/endpoints
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ai_service import detect_food
from app.db.mysql import get_db_connection
from pydantic import BaseModel
from typing import List
from app.services.ai_service import get_gemini_suggestion
from app.db.mysql import get_db_connection
from app.services.ai_service import detect_food, get_gemini_suggestion, chat_with_gemini


router = APIRouter()

@router.get("/foods")
async def get_all_foods():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) # Để kết quả trả về dạng { "DISH_NAME": "Cơm" ... }
        
        sql = "SELECT * FROM COOKED_FOOD WHERE DELETED_AT IS NULL"
        
        cursor.execute(sql)
        foods = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"success": True, "data": foods}
            
    except Exception as e:
        print(f"❌ Lỗi lấy món ăn: {e}")
        return {"success": False, "data": [], "error": str(e)}
    
@router.post("/detect")
async def detect_ingredients(file: UploadFile = File(...)):
    # 1. Kiểm tra định dạng file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File tải lên không phải là hình ảnh")
    
    try:
        # 2. Đọc dữ liệu ảnh
        contents = await file.read()
        
        # 3. Gọi Service AI
        ingredients = detect_food(contents)
        
        # 4. Trả về kết quả
        return {
            "message": "Thành công",
            "ingredients": ingredients
        }

    except Exception as e:
        # 5. Bắt lỗi
        print(f"❌ Lỗi nhận diện AI: {e}")
        # Trả về lỗi 500
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý hình ảnh: {str(e)}")
# 1. CẬP NHẬT MODEL ĐỂ NHẬN STRING
class SuggestionRequest(BaseModel):
    firebase_id: str  
    ingredients: List[str]

@router.post("/suggest")
async def suggest_food(request: SuggestionRequest):
    try:
        # 2. KẾT NỐI DB
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 3.SQL
        # - Lấy cột GOAL_TYPE 
        # - Tìm theo FIREBASE_ID
        sql = "SELECT GOAL_TYPE FROM USER_PROFILE WHERE FIREBASE_ID = %s" 
        
        cursor.execute(sql, (request.firebase_id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()

        # 4. XỬ LÝ MỤC TIÊU ĐỂ GỬI CHO AI
        # Dữ liệu trong DB là: 'lose', 'gain', 'maintain' 
        goal_mapping = {
            "lose": "giảm cân",
            "gain": "tăng cân",
            "maintain": "duy trì cân nặng"
        }

        if result:
            db_goal = result['GOAL_TYPE'] # Lấy giá trị từ cột GOAL_TYPE
            user_goal = goal_mapping.get(db_goal, "ăn uống lành mạnh")
        else:
            # Trường hợp user chưa cập nhật profile
            user_goal = "ăn uống lành mạnh"

        # 5. GỌI GEMINI
        # Prompt sẽ thành: "...cho người có mục tiêu 'giảm cân'..."
        ai_response = get_gemini_suggestion(request.ingredients, user_goal)

        return {
            "success": True,
            "reply": ai_response
        }

    except Exception as e:
        print(f"❌ Lỗi API suggest: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
# 2. Định nghĩa Model dữ liệu gửi lên
class ChatRequest(BaseModel):
    message: str

# 3. Tạo API endpoint mới
@router.post("/chat")
async def chat_bot(request: ChatRequest):
    try:
        reply = chat_with_gemini(request.message)
        return {"success": True, "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))