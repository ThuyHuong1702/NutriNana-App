from fastapi import APIRouter, HTTPException, Query
from app.db.mysql import get_db_connection
from app.schemas.food_log import FoodLogItem
from datetime import date, timedelta

router = APIRouter()

# Hàm hỗ trợ: Lấy USER_ID từ FIREBASE_ID
def get_user_id(cursor, firebase_id):
    cursor.execute("SELECT ID FROM USER_PROFILE WHERE FIREBASE_ID = %s", (firebase_id,))
    result = cursor.fetchone()
    return result['ID'] if result else None

# Hàm hỗ trợ: Chuyển đổi tên bữa ăn sang ID
def get_meal_type_id(label):
    mapping = {
        "Sáng": 1,
        "Trưa": 2,
        "Tối": 3,
        "Phụ": 4,
        "Vận động": 5 
    }
    # Mặc định là bữa phụ nếu không khớp
    return mapping.get(label.replace("Bữa ", ""), 4) 

@router.get("/get-daily-log/{firebase_uid}")
async def get_daily_log(firebase_uid: str, date_str: str = Query(None)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Lấy USER_ID (Giữ nguyên)
        cursor.execute("SELECT ID FROM USER_PROFILE WHERE FIREBASE_ID = %s", (firebase_uid,))
        user = cursor.fetchone()
        if not user:
            return {"success": False, "message": "User not found"}
        
        user_id = user['ID']
        target_date = date_str if date_str else str(date.today())

        # 2. Lấy dữ liệu Join (SỬA LẠI CÂU SQL NÀY)
        # Chúng ta cần lấy:
        # - F.PROTEIN, F.CARB, F.FAT: Dinh dưỡng gốc (cho 1 phần) để tính toán lại
        # - L.PROTEIN, ...: Dinh dưỡng đã lưu (để hiển thị tổng)
        sql = """
            SELECT 
                L.F_LOG_ID, L.QUANTITY, L.MEAL_TYPE, 
                L.CALORIES as LOG_CAL, 
                L.PROTEIN as LOG_PROTEIN, L.CARB as LOG_CARB, L.FAT as LOG_FAT,
                
                F.C_FOOD_ID, F.DISH_NAME, F.IMAGE_PATH, F.UNIT, 
                F.CALORIES as BASE_CAL,
                F.PROTEIN as BASE_PROTEIN, F.CARB as BASE_CARB, F.FAT as BASE_FAT
            FROM DAILY_FOOD_LOG L
            JOIN COOKED_FOOD F ON L.C_FOOD_ID = F.C_FOOD_ID
            WHERE L.USER_ID = %s AND L.LOG_DATE = %s
        """
        cursor.execute(sql, (user_id, target_date))
        logs = cursor.fetchall()

        cursor.close()
        conn.close()

        # 3. Mapping MEAL_TYPE (Giữ nguyên)
        meal_map = {1: "Sáng", 2: "Trưa", 3: "Tối", 4: "Phụ", 5: "Vận động"}
        
        formatted_logs = []
        for log in logs:
            meal_name = meal_map.get(log['MEAL_TYPE'], "Phụ")
            formatted_logs.append({
                **log,
                "meal_label": meal_name
            })

        return {"success": True, "data": formatted_logs}

    except Exception as e:
        print(f"❌ Lỗi Get Log: {e}")
        return {"success": False, "data": []}
    
@router.post("/log-food")
async def log_food(data: FoodLogItem):
    print(f"📥 Nhận yêu cầu Log món: {data.food_id} - SL: {data.quantity}")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Tìm USER_ID thật trong MySQL
        user_id = get_user_id(cursor, data.firebase_id)
        if not user_id:
            raise HTTPException(status_code=404, detail="User not found in MySQL")

        # 2. Chuyển đổi loại bữa ăn
        meal_type = get_meal_type_id(data.meal_label)

        # 3. Kiểm tra xem món này đã tồn tại trong bữa ăn ngày hôm đó chưa?
        # Logic: Nếu người dùng đã thêm "Cơm" vào "Bữa sáng" hôm nay rồi, thì ta sẽ update dòng đó
        check_sql = """
            SELECT F_LOG_ID FROM DAILY_FOOD_LOG 
            WHERE USER_ID = %s AND C_FOOD_ID = %s AND MEAL_TYPE = %s AND LOG_DATE = %s
        """
        cursor.execute(check_sql, (user_id, data.food_id, meal_type, data.log_date))
        existing_log = cursor.fetchone()

        # --- TRƯỜNG HỢP XÓA (Nếu số lượng <= 0) ---
        if data.quantity <= 0:
            if existing_log:
                delete_sql = "DELETE FROM DAILY_FOOD_LOG WHERE F_LOG_ID = %s"
                cursor.execute(delete_sql, (existing_log['F_LOG_ID'],))
                conn.commit()
                print("🗑️ Đã xóa món ăn khỏi nhật ký")
            return {"message": "Item deleted", "action": "delete"}

        # --- TRƯỜNG HỢP CẬP NHẬT (Nếu đã tồn tại) ---
        if existing_log:
            update_sql = """
                UPDATE DAILY_FOOD_LOG 
                SET QUANTITY = %s, CALORIES = %s, PROTEIN = %s, CARB = %s, FAT = %s, UPDATED_AT = NOW()
                WHERE F_LOG_ID = %s
            """
            cursor.execute(update_sql, (
                data.quantity, data.calories, data.protein, data.carb, data.fat, 
                existing_log['F_LOG_ID']
            ))
            print("🔄 Đã cập nhật số lượng món ăn")
            action = "update"

        # --- TRƯỜNG HỢP THÊM MỚI (Nếu chưa có) ---
        else:
            insert_sql = """
                INSERT INTO DAILY_FOOD_LOG 
                (USER_ID, C_FOOD_ID, MEAL_TYPE, QUANTITY, CALORIES, PROTEIN, CARB, FAT, LOG_DATE)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_sql, (
                user_id, data.food_id, meal_type, data.quantity, 
                data.calories, data.protein, data.carb, data.fat, data.log_date
            ))
            print("✅ Đã thêm món mới vào nhật ký")
            action = "insert"

        conn.commit()
        cursor.close()
        conn.close()
        
        return {"success": True, "message": "Saved successfully", "action": action}

    except Exception as e:
        print(f"❌ Lỗi Log Food: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
#món ăn gần đây
@router.get("/get-recent-foods/{firebase_uid}")
async def get_recent_foods(firebase_uid: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Lấy USER_ID từ Firebase ID
        user_id = get_user_id(cursor, firebase_uid)
        if not user_id:
            return {"success": False, "message": "User not found"}

        # 2. Tính ngày giới hạn (14 ngày trước)
        limit_date = date.today() - timedelta(days=14)

        # 3. Truy vấn SQL
        # Logic: Lấy món ăn trong log >= ngày giới hạn
        # GROUP BY để mỗi món chỉ hiện 1 lần
        # ORDER BY MAX(LOG_DATE) để món ăn gần nhất lên đầu
        sql = """
            SELECT 
                F.C_FOOD_ID, 
                F.DISH_NAME, 
                F.IMAGE_PATH, 
                F.UNIT, 
                F.CALORIES,
                F.PROTEIN,
                F.CARB,
                F.FAT,
                MAX(L.LOG_DATE) as LAST_EATEN
            FROM DAILY_FOOD_LOG L
            JOIN COOKED_FOOD F ON L.C_FOOD_ID = F.C_FOOD_ID
            WHERE L.USER_ID = %s AND L.LOG_DATE >= %s
            GROUP BY F.C_FOOD_ID, F.DISH_NAME, F.IMAGE_PATH, F.UNIT, F.CALORIES, F.PROTEIN, F.CARB, F.FAT
            ORDER BY LAST_EATEN DESC
        """
        
        cursor.execute(sql, (user_id, limit_date))
        recent_foods = cursor.fetchall()

        cursor.close()
        conn.close()

        # 4. Format dữ liệu trả về (nếu cần thiết)
        # Frontend có thể dùng list này để hiển thị trong tab "Gần đây"
        
        return {"success": True, "data": recent_foods}

    except Exception as e:
        print(f"❌ Lỗi Get Recent Foods: {e}")
        return {"success": False, "data": []}

#Món ăn yêu thích    
@router.get("/get-favorite-foods/{firebase_uid}")
async def get_favorite_foods(firebase_uid: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Lấy USER_ID
        user_id = get_user_id(cursor, firebase_uid)
        if not user_id:
            return {"success": False, "message": "User not found"}

        # 2. Truy vấn tìm món ăn đã ăn > 5 lần
        # Logic:
        # - JOIN bảng LOG và FOOD
        # - GROUP BY theo món ăn
        # - HAVING COUNT(*) > 5: Chỉ lấy những nhóm có số lượng bản ghi > 5
        sql = """
            SELECT 
                F.C_FOOD_ID, 
                F.DISH_NAME, 
                F.IMAGE_PATH, 
                F.UNIT, 
                F.CALORIES,
                F.PROTEIN,
                F.CARB,
                F.FAT,
                COUNT(L.C_FOOD_ID) as EATING_COUNT
            FROM DAILY_FOOD_LOG L
            JOIN COOKED_FOOD F ON L.C_FOOD_ID = F.C_FOOD_ID
            WHERE L.USER_ID = %s
            GROUP BY F.C_FOOD_ID, F.DISH_NAME, F.IMAGE_PATH, F.UNIT, F.CALORIES, F.PROTEIN, F.CARB, F.FAT
            HAVING EATING_COUNT > 5
            ORDER BY EATING_COUNT DESC
        """
        
        cursor.execute(sql, (user_id,))
        favorites = cursor.fetchall()

        cursor.close()
        conn.close()

        return {"success": True, "data": favorites}

    except Exception as e:
        print(f"❌ Lỗi Get Favorites: {e}")
        return {"success": False, "data": []}
    
#Lấy thực phẩm theo nhóm
@router.get("/get-foods-by-category")
async def get_foods_by_category(category: str = Query(...)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Truy vấn tìm món ăn theo cột CATEGORY
        # Lưu ý: Cột CATEGORY trong database phải chứa các chuỗi như "Ngũ cốc", "Đồ uống"...
        sql = """
            SELECT * FROM COOKED_FOOD 
            WHERE CATEGORY = %s
        """
        
        cursor.execute(sql, (category,))
        foods = cursor.fetchall()

        cursor.close()
        conn.close()

        return {"success": True, "data": foods}

    except Exception as e:
        print(f"❌ Lỗi Get Foods By Category: {e}")
        return {"success": False, "data": []}
    
#Tìm kiếm món ăn
@router.get("/search-food")
async def search_food(q: str = Query(..., min_length=1)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Sử dụng LIKE %...% để tìm kiếm gần đúng
        sql = """
            SELECT * FROM COOKED_FOOD 
            WHERE DISH_NAME LIKE %s
            LIMIT 50
        """
        # Thêm dấu % vào đầu và cuối từ khóa
        search_pattern = f"%{q}%"
        
        cursor.execute(sql, (search_pattern,))
        foods = cursor.fetchall()

        cursor.close()
        conn.close()

        return {"success": True, "data": foods}

    except Exception as e:
        print(f"❌ Lỗi Search Food: {e}")
        return {"success": False, "data": []}