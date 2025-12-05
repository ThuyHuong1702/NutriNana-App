import os
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

class Settings:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "admin123")
    DB_NAME = os.getenv("DB_NAME", "NutriNana")

    # Cấu hình kết nối cho mysql.connector
    DB_CONFIG = {
        'host': DB_HOST,
        'user': DB_USER,
        'password': DB_PASSWORD,
        'database': DB_NAME
    }

settings = Settings()