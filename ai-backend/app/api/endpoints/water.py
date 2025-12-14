# app/api/endpoints/water.py
from fastapi import APIRouter, Depends, HTTPException
from app.db.mysql import get_db_connection
from app.schemas.water import WaterFavoriteResponse, LogWaterRequest, LogWaterResponse, UpdateFavoriteRequest
from datetime import datetime

router = APIRouter()

# 1. API Lấy danh sách nước yêu thích
@router.get("/get-water-favorites/{firebase_uid}", response_model=WaterFavoriteResponse)
async def get_water_favorites(firebase_uid: str, db=Depends(get_db_connection)):
    cursor = db.cursor(dictionary=True)
    try:
        # ✅ Dùng FIREBASE_ID như bạn yêu cầu
        cursor.execute("SELECT ID FROM USER_PROFILE WHERE FIREBASE_ID = %s", (firebase_uid,))
        user = cursor.fetchone()
        
        if not user:
            return {"success": False, "data": [], "message": "User not found"}
        
        user_id = user['ID']

        # Truy vấn danh sách
        query = """
            SELECT 
                UWF.FAV_ID,
                UWF.W_ID,
                UWF.DEFAULT_VOLUME,
                UWF.DISPLAY_ORDER,
                W.W_NAME as drink_name,
                W.IMAGE_PATH,
                W.TRUE_WATER
            FROM USER_WATER_FAVORITES UWF
            JOIN WATER W ON UWF.W_ID = W.W_ID
            WHERE UWF.USER_ID = %s
            ORDER BY UWF.DISPLAY_ORDER ASC
        """
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()
        
        return {"success": True, "data": results}

    except Exception as e:
        print(f"Error fetching water favorites: {e}")
        return {"success": False, "data": [], "message": str(e)}
        
    finally:
        cursor.close()
        db.close()

# 2. API Ghi nhận uống nước
@router.post("/log-water", response_model=LogWaterResponse)
async def log_water(req: LogWaterRequest, db=Depends(get_db_connection)):
    cursor = db.cursor(dictionary=True)
    try:
        # ✅ Dùng FIREBASE_ID như bạn yêu cầu
        cursor.execute("SELECT ID FROM USER_PROFILE WHERE FIREBASE_ID = %s", (req.uid,))
        user = cursor.fetchone()
        if not user:
            return {"success": False, "message": "User not found"}
        
        user_id = user['ID']

        # Lấy tỷ lệ nước thực tế
        cursor.execute("SELECT TRUE_WATER FROM WATER WHERE W_ID = %s", (req.w_id,))
        water_info = cursor.fetchone()
        
        if not water_info:
            return {"success": False, "message": "Water type not found"}
            
        true_water_val = water_info['TRUE_WATER']
        actual_water = req.amount_ml * (true_water_val / 100)

        # --- LOGIC THỜI GIAN (Giữ nguyên phần này vì nó quan trọng) ---
        current_time_str = datetime.now().strftime("%H:%M:%S")
        log_timestamp = f"{req.date_str} {current_time_str}" 

        insert_query = """
            INSERT INTO DAILY_WATER_LOG (USER_ID, W_ID, VOLUME_ML, ACTUAL_WATER_ML, LOG_TIME)
            VALUES (%s, %s, %s, %s, %s) 
        """
        cursor.execute(insert_query, (user_id, req.w_id, req.amount_ml, actual_water, log_timestamp))
        db.commit()

        return {"success": True, "message": "Logged water successfully"}

    except Exception as e:
        print(f"Log water error: {e}")
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        db.close()

# 3. API Lấy lịch sử uống nước chi tiết trong ngày (MỚI)
@router.get("/get-water-logs/{firebase_uid}")
async def get_water_logs(firebase_uid: str, date_str: str, db=Depends(get_db_connection)):
    cursor = db.cursor(dictionary=True)
    try:
        # Lấy User ID từ Firebase UID
        cursor.execute("SELECT ID FROM USER_PROFILE WHERE FIREBASE_ID = %s", (firebase_uid,))
        user = cursor.fetchone()
        if not user:
            return {"success": False, "data": [], "message": "User not found"}
        user_id = user['ID']

        # Query lấy lịch sử + Join với bảng WATER để lấy tên và ảnh
        query = """
            SELECT 
                L.LOG_ID,
                L.W_ID,
                L.VOLUME_ML,
                L.ACTUAL_WATER_ML,
                L.LOG_TIME,
                W.W_NAME as drink_name,
                W.IMAGE_PATH
            FROM DAILY_WATER_LOG L
            JOIN WATER W ON L.W_ID = W.W_ID
            WHERE L.USER_ID = %s AND DATE(L.LOG_TIME) = %s
            ORDER BY L.LOG_TIME DESC
        """
        cursor.execute(query, (user_id, date_str))
        results = cursor.fetchall()

        return {"success": True, "data": results}

    except Exception as e:
        print(f"Error fetching water logs: {e}")
        return {"success": False, "data": [], "message": str(e)}
    finally:
        cursor.close()
        db.close()

# 4. API Xóa lịch sử uống nước
@router.delete("/delete-water-log/{log_id}")
async def delete_water_log(log_id: int, db=Depends(get_db_connection)):
    cursor = db.cursor()
    try:
        # Xóa bản ghi trong bảng DAILY_WATER_LOG
        query = "DELETE FROM DAILY_WATER_LOG WHERE LOG_ID = %s"
        cursor.execute(query, (log_id,))
        db.commit()

        if cursor.rowcount > 0:
            return {"success": True, "message": "Deleted successfully"}
        else:
            return {"success": False, "message": "Log not found"}

    except Exception as e:
        print(f"Error deleting log: {e}")
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        db.close()

# 5. API Lấy danh sách tất cả loại nước (cho Modal chọn)
@router.get("/get-all-water-types")
async def get_all_water_types(db=Depends(get_db_connection)):
    cursor = db.cursor(dictionary=True)
    try:
        # Lấy tất cả loại nước trong bảng WATER
        cursor.execute("SELECT * FROM WATER ORDER BY W_NAME ASC")
        water_types = cursor.fetchall()
        return {"success": True, "data": water_types}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        db.close()

# 6. API Cập nhật mục yêu thích (ĐÃ SỬA)
@router.post("/update-water-favorite")
async def update_water_favorite(req: UpdateFavoriteRequest, db=Depends(get_db_connection)): 
    # Sử dụng dictionary=True để dễ lấy dữ liệu theo tên cột
    cursor = db.cursor(dictionary=True) 
    try:
        # BƯỚC 1: Lấy USER_ID (INT) từ FIREBASE_ID (String)
        # req.uid chính là chuỗi 'mnPPe...'
        cursor.execute("SELECT ID FROM USER_PROFILE WHERE FIREBASE_ID = %s", (req.uid,))
        user = cursor.fetchone()
        
        if not user:
            return {"success": False, "message": "User not found with this Firebase UID"}
            
        user_id = user['ID'] # Đây mới là số ID nội bộ (ví dụ: 1, 2, 10...)

        # BƯỚC 2: Thực hiện Update dùng user_id vừa tìm được
        query = """
            UPDATE USER_WATER_FAVORITES 
            SET W_ID = %s, DEFAULT_VOLUME = %s 
            WHERE USER_ID = %s AND W_ID = %s
        """
        # Thay req.uid bằng user_id
        cursor.execute(query, (req.new_w_id, req.new_volume, user_id, req.old_w_id))
        db.commit()

        if cursor.rowcount > 0:
            return {"success": True, "message": "Updated successfully"}
        else:
            # Có thể không tìm thấy dòng khớp với old_w_id
            return {"success": False, "message": "Favorite item not found to update"}

    except Exception as e:
        print(f"Error update: {e}")
        return {"success": False, "message": str(e)}
    finally:
        cursor.close()
        db.close()