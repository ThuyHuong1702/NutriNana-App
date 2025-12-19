# ai-backend/check.py
from google import genai
import os

MY_API_KEY = "AIzaSyDzRL8S7I7N_rwe1CTMUAVIJZJSEsL69bM" 

print(f"--- Đang kết nối tới Google với Key: {MY_API_KEY[:5]}... ---")


try:
    client = genai.Client(api_key=MY_API_KEY)
    
    # Lấy danh sách
    print("\n✅ DANH SÁCH TÊN MODEL:")
    
    for model in client.models.list():
        # In ra tên model 
        print(f"👉 {model.name}")

except Exception as e:
    print(f"\n❌ LỖI: {e}")