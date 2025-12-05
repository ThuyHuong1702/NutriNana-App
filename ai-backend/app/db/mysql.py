import mysql.connector
from app.core.config import settings

def get_db_connection():
    """Tạo kết nối đến MySQL"""
    try:
        connection = mysql.connector.connect(**settings.DB_CONFIG)
        return connection
    except mysql.connector.Error as err:
        print(f"❌ Lỗi kết nối MySQL: {err}")
        raise err