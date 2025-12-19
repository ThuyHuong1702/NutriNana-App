# ai-backend/app/services/ai_service.py
from ultralytics import YOLO
from PIL import Image
from google import genai
import io
import os

# Đường dẫn đến file best.pt 
MODEL_PATH = "app/core/best.pt" 

try:
    model = YOLO(MODEL_PATH)
except Exception as e:
    print(f"Không tìm thấy model tại {MODEL_PATH}. Hãy kiểm tra lại đường dẫn! Lỗi: {e}")
    model = None

def detect_food(image_bytes):
    if not model:
        return []
    
    # Chuyển bytes thành ảnh
    image = Image.open(io.BytesIO(image_bytes))
    
    # Chạy nhận diện
    results = model(image, conf=0.4) # conf=0.4 là độ tin cậy tối thiểu
    
    detected_items = []
    seen = set()

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            
            # Lọc trùng lặp
            if class_name not in seen:
                detected_items.append(class_name)
                seen.add(class_name)
                
    return detected_items

GEMINI_API_KEY = "AIzaSyDzRL8S7I7N_rwe1CTMUAVIJZJSEsL69bM" 

client = genai.Client(api_key=GEMINI_API_KEY)

def get_gemini_suggestion(ingredients_list, user_goal):
    try:
        # Tạo chuỗi nguyên liệu
        ingredients_str = ", ".join(ingredients_list)
        
        prompt = (
            f"Với các nguyên liệu: \"{ingredients_str}\". "
            f"Hãy cho tôi danh sách các món ăn làm từ các nguyên liệu trên "
            f"cho người có mục tiêu \"{user_goal}\". "
            "Hãy trả lời ngắn gọn, chia thành các gạch đầu dòng."
        )

        print("\n" + "="*20 + " [DEBUG PROMPT] " + "="*20)
        print(prompt)
        print("="*56 + "\n")

        # Gọi model
        response = client.models.generate_content(
            model="gemini-flash-latest", 
            contents=prompt
        )
        
        return response.text

    except Exception as e:
        print(f"❌ Lỗi Gemini: {e}")
        return "Xin lỗi, hiện tại Nana không thể kết nối với trí tuệ nhân tạo."
    
def chat_with_gemini(user_message):
    try:
        # Prompt cho chat
        prompt = f"Người dùng hỏi: \"{user_message}\". Hãy trả lời ngắn gọn, thân thiện và hữu ích."

        response = client.models.generate_content(
            model="gemini-flash-latest", 
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"❌ Lỗi Chat: {e}")
        return "Xin lỗi, mình đang gặp chút trục trặc khi suy nghĩ câu trả lời."