from fastapi import APIRouter, Query, Body
from app.db.mysql import get_db_connection
from datetime import date, timedelta
from pydantic import BaseModel

router = APIRouter()

# --- MODELS CHO POST REQUEST ---
class ActivityLogSchema(BaseModel):
    firebase_id: str
    level_id: int
    duration_minutes: int
    calories_burned: float
    log_date: str

class FavoriteSchema(BaseModel):
    firebase_id: str
    activity_id: int

# --- HELPER FUNCTIONS ---
def get_user_id(cursor, firebase_id):
    cursor.execute("SELECT ID FROM USER_PROFILE WHERE FIREBASE_ID = %s", (firebase_id,))
    result = cursor.fetchone()
    return result['ID'] if result else None

def group_activities(rows):
    activities_dict = {}
    for row in rows:
        act_id = row['id']
        if act_id not in activities_dict:
            activities_dict[act_id] = {
                "id": act_id,
                "name": row['name'],
                "image_url": row['image_url'],
                "is_favorite": bool(row.get('is_favorite', 0)), 
                "levels": []
            }
        
        if row['level_name']:
            activities_dict[act_id]["levels"].append({
                "level_id": row['level_id'],
                "level_name": row['level_name'],
                "met_value": row['met_value']
            })
    return list(activities_dict.values())

# --- API 1: LẤY DANH SÁCH ---
@router.get("/activities")
async def get_activities(
    category: str = Query("Phổ biến"), 
    firebase_uid: str = Query(None)
):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id = get_user_id(cursor, firebase_uid) if firebase_uid else None
        
        # SQL
        base_sql = """
            SELECT 
                A.ACTIVITY_ID as id,
                A.ACTIVITY_NAME as name,
                A.IMAGE_PATH as image_url,
                L.LEVEL_ID as level_id,
                L.LEVEL_NAME as level_name,
                L.MET_VALUE as met_value,
                F.FAVORITE_ACT as is_favorite
            FROM ACTIVITIES A
            LEFT JOIN ACTIVITY_LEVELS L ON A.ACTIVITY_ID = L.ACTIVITY_ID
            LEFT JOIN USER_FAVORITE_ACTIVITIES F ON A.ACTIVITY_ID = F.ACTIVITY_ID AND F.USER_ID = %s
        """
        
        params = [user_id]
        
        if category == "Phổ biến":
            cursor.execute(base_sql, params)
            
        elif category == "Yêu thích" and user_id:
            sql = base_sql + " WHERE F.FAVORITE_ACT = 1"
            cursor.execute(sql, params)
            
        elif category == "Gần đây" and user_id:
            sql_log = """
                SELECT L.ACTIVITY_ID 
                FROM DAILY_ACTIVITY_LOG D
                JOIN ACTIVITY_LEVELS L ON D.LEVEL_ID = L.LEVEL_ID
                WHERE D.USER_ID = %s 
                GROUP BY L.ACTIVITY_ID
                ORDER BY MAX(D.LOG_DATE) DESC 
                LIMIT 20
            """
            cursor.execute(sql_log, (user_id,))
            log_rows = cursor.fetchall()

            recent_ids = [row['ACTIVITY_ID'] for row in log_rows]

            if not recent_ids:
                return {"success": True, "data": []}

            format_strings = ','.join(['%s'] * len(recent_ids))
            
            sql = f"""
                SELECT 
                    A.ACTIVITY_ID as id,
                    A.ACTIVITY_NAME as name,
                    A.IMAGE_PATH as image_url,
                    L.LEVEL_ID as level_id,
                    L.LEVEL_NAME as level_name,
                    L.MET_VALUE as met_value,
                    F.FAVORITE_ACT as is_favorite
                FROM ACTIVITIES A
                LEFT JOIN ACTIVITY_LEVELS L ON A.ACTIVITY_ID = L.ACTIVITY_ID
                LEFT JOIN USER_FAVORITE_ACTIVITIES F ON A.ACTIVITY_ID = F.ACTIVITY_ID AND F.USER_ID = %s
                WHERE A.ACTIVITY_ID IN ({format_strings})
            """
            
            params = [user_id] + recent_ids
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            
            grouped_data = group_activities(rows)
            # Sắp xếp lại theo thứ tự thời gian
            grouped_data.sort(key=lambda x: recent_ids.index(x['id']) if x['id'] in recent_ids else 999)
            
            return {"success": True, "data": grouped_data}
            
        else:
            # Lấy theo category
            sql = base_sql + " WHERE A.CATEGORY = %s"
            cursor.execute(sql, [user_id, category])

        rows = cursor.fetchall()
        return {"success": True, "data": group_activities(rows)}

    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "data": []}
    finally:
        conn.close()

# --- API 2: LƯU HOẠT ĐỘNG ---
@router.post("/log-activity")
async def log_activity(payload: ActivityLogSchema):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id = get_user_id(cursor, payload.firebase_id)
        if not user_id:
            return {"success": False, "message": "User not found"}

        sql = """
            INSERT INTO DAILY_ACTIVITY_LOG (USER_ID, LEVEL_ID, DURATION_MINUTES, CALORIES_BURNED, LOG_DATE)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            user_id, 
            payload.level_id, 
            payload.duration_minutes, 
            payload.calories_burned, 
            payload.log_date
        ))
        conn.commit()
        return {"success": True, "message": "Logged successfully"}
    except Exception as e:
        print(f"Log Error: {e}")
        return {"success": False, "message": str(e)}
    finally:
        conn.close()

# --- API 3: THẢ TIM ---
@router.post("/toggle-favorite-activity")
async def toggle_favorite(payload: FavoriteSchema):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        user_id = get_user_id(cursor, payload.firebase_id)
        if not user_id: return {"success": False, "message": "User not found"}

        check_sql = "SELECT * FROM USER_FAVORITE_ACTIVITIES WHERE USER_ID = %s AND ACTIVITY_ID = %s"
        cursor.execute(check_sql, (user_id, payload.activity_id))
        existing = cursor.fetchone()

        if existing:
            del_sql = "DELETE FROM USER_FAVORITE_ACTIVITIES WHERE USER_ID = %s AND ACTIVITY_ID = %s"
            cursor.execute(del_sql, (user_id, payload.activity_id))
            action = "removed"
        else:
            ins_sql = "INSERT INTO USER_FAVORITE_ACTIVITIES (USER_ID, ACTIVITY_ID, FAVORITE_ACT) VALUES (%s, %s, 1)"
            cursor.execute(ins_sql, (user_id, payload.activity_id))
            action = "added"
        
        conn.commit()
        return {"success": True, "action": action}
    except Exception as e:
        return {"success": False, "message": str(e)}
    finally:
        conn.close()