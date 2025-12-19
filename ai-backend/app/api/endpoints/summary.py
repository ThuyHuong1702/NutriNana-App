# app/api/endpoints/summary.py
from fastapi import APIRouter, Query
from app.db.mysql import get_db_connection
from datetime import date

router = APIRouter()

@router.get("/get-daily-summary/{firebase_id}")
async def get_daily_summary(firebase_id: str, date_str: str = Query(None)):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Lấy ID và MỤC TIÊU từ bảng USER_PROFILE
        sql_user = """
            SELECT ID, DAILY_CALORIE, DAILY_WATER_L 
            FROM USER_PROFILE 
            WHERE FIREBASE_ID = %s
        """
        cursor.execute(sql_user, (firebase_id,))
        user_res = cursor.fetchone()
        
        if not user_res:
            return {"success": False, "message": "User not found"}
        
        user_id = user_res['ID']
        # Mặc định mục tiêu là 2000 calo và 2 lít nước nếu dữ liệu bị null
        target_calories = user_res['DAILY_CALORIE'] if user_res['DAILY_CALORIE'] else 2000
        target_water_l = user_res['DAILY_WATER_L'] if user_res['DAILY_WATER_L'] else 2
        
        # Nếu không truyền ngày, lấy ngày hôm nay
        target_date = date_str if date_str else str(date.today())

        # 2. Tính tổng ĐÃ ĂN (Nạp vào) từ bảng DAILY_FOOD_LOG
        sql_food = """
            SELECT 
                COALESCE(SUM(CALORIES), 0) as total_cal,
                COALESCE(SUM(PROTEIN), 0) as total_protein,
                COALESCE(SUM(CARB), 0) as total_carb,
                COALESCE(SUM(FAT), 0) as total_fat
            FROM DAILY_FOOD_LOG 
            WHERE USER_ID = %s AND LOG_DATE = %s
        """
        cursor.execute(sql_food, (user_id, target_date))
        food_data = cursor.fetchone()

        # 3. Tính tổng ĐÃ ĐỐT (Vận động) từ bảng DAILY_ACTIVITY_LOG
        sql_activity = """
            SELECT COALESCE(SUM(CALORIES_BURNED), 0) as total_burned
            FROM DAILY_ACTIVITY_LOG
            WHERE USER_ID = %s AND LOG_DATE = %s
        """
        cursor.execute(sql_activity, (user_id, target_date))
        activity_data = cursor.fetchone()

        # 4. Tính tổng NƯỚC đã uống từ bảng DAILY_WATER_LOG
        sql_water = """
            SELECT COALESCE(SUM(ACTUAL_WATER_ML), 0) as total_water
            FROM DAILY_WATER_LOG
            WHERE USER_ID = %s AND DATE(LOG_TIME) = %s
        """
        cursor.execute(sql_water, (user_id, target_date))
        water_data = cursor.fetchone()

        # 5. Trả về kết quả
        return {
            "success": True,
            "data": {
                # Dữ liệu thực tế (Đã ăn)
                "consumed_calories": food_data['total_cal'],
                "consumed_protein": food_data['total_protein'],
                "consumed_carbs": food_data['total_carb'],
                "consumed_fat": food_data['total_fat'],
                
                # Dữ liệu vận động (Đã đốt)
                "burned_calories": activity_data['total_burned'],

                # Dữ liệu nước (Đã uống)
                "consumed_water": int(water_data['total_water']),
                
                # Dữ liệu mục tiêu (Lấy từ User Profile)
                "target_calories": target_calories,
                "target_water_ml": target_water_l * 1000 
            }
        }

    except Exception as e:
        print(f"Error summary: {e}")
        return {"success": False, "data": None, "message": str(e)}
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()