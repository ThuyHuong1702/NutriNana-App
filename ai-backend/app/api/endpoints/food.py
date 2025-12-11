#ai-backend/app/api/endpoints
from fastapi import APIRouter, HTTPException
from app.db.mysql import get_db_connection

router = APIRouter()

@router.get("/foods")
async def get_all_foods():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) # Để kết quả trả về dạng { "DISH_NAME": "Cơm" ... }
        
        # 👇 Lấy dữ liệu từ bảng COOKED_FOOD (Chỉ lấy món chưa bị xóa)
        sql = "SELECT * FROM COOKED_FOOD WHERE DELETED_AT IS NULL"
        
        cursor.execute(sql)
        foods = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"success": True, "data": foods}
            
    except Exception as e:
        print(f"❌ Lỗi lấy món ăn: {e}")
        return {"success": False, "data": [], "error": str(e)}