# ai-backend/app/services/ai_service.py
import pandas as pd
import os
import json
import io
from ultralytics import YOLO
from PIL import Image
from google import genai
from google.genai import types
from thefuzz import process, fuzz

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

GEMINI_API_KEY = "AIzaSyCf17XsprRxI57DAiyeZFvzVFbdUxqLiEA" 

client = genai.Client(api_key=GEMINI_API_KEY)

# --- CẤU HÌNH ĐƯỜNG DẪN ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "core", "best.pt")
NUTRITION_PATH = os.path.join(BASE_DIR, "core", "ThanhPhanDinhDuong_Full_21_Cols_Fixed.csv")

# --- NẠP MODEL & DỮ LIỆU ---
try:
    model = YOLO(MODEL_PATH)
    df_nutrition = pd.read_csv(NUTRITION_PATH, encoding='utf-8')
    print("✅ Hệ thống đã sẵn sàng: Model và CSV đã nạp.")
except Exception as e:
    print(f"❌ Lỗi nạp tài nguyên: {e}")
    model = None
    df_nutrition = None

client = genai.Client(api_key="AIzaSyCf17XsprRxI57DAiyeZFvzVFbdUxqLiEA")

def get_calories_from_csv(food_input):
    # Kiểm tra dữ liệu
    if df_nutrition is None: 
        return f"{food_input}: 0kcal"

    # 1. Chuẩn hóa đầu vào thành list
    if isinstance(food_input, list):
        food_list = food_input
    elif isinstance(food_input, str):
        if "," in food_input:
            food_list = [f.strip() for f in food_input.split(",")]
        else:
            food_list = [food_input]
    else:
        return "Lỗi định dạng đầu vào"

    total_calories = 0
    details = []
    
    # Danh sách tất cả tên món ăn trong CSV để so sánh
    all_food_names = df_nutrition['Tên thực phẩm (VN)'].tolist()

    # 2. Duyệt qua từng món
    for food_name in food_list:
        food_name_clean = str(food_name).lower().strip()
        
        food_name_search = food_name_clean.replace("lợn", "heo").replace("ba chỉ", "ba rọi")

        # Tìm kiếm mờ (Fuzzy Search) ---
        # Lấy ra tên món trong CSV giống nhất với input (trên 70% độ giống)
        # limit=1: Chỉ lấy 1 kết quả tốt nhất
        best_match = process.extractOne(food_name_search, all_food_names, scorer=fuzz.token_set_ratio)
        
        found = False
        if best_match:
            match_name, score = best_match
            # Nếu độ giống > 70% thì chấp nhận
            if score >= 70:
                # Lấy dòng dữ liệu tương ứng với tên tìm thấy
                row = df_nutrition[df_nutrition['Tên thực phẩm (VN)'] == match_name].iloc[0]
                calories = float(row['Năng lượng (Kcal)'])
                total_calories += calories
                
                # Log ra để kiểm tra
                print(f"✅ Map thành công: '{food_name}' -> '{match_name}' ({int(calories)}kcal) - Độ giống: {score}%")
                
                details.append(f"{food_name} ({int(calories)}kcal)")
                found = True
        
        if not found:
            print(f"❌ Không tìm thấy: '{food_name}' (Đã thử tìm: '{food_name_search}')")
            details.append(f"{food_name} (0kcal)")

    # 3. Trả về kết quả
    if len(food_list) == 1:
        return f"{food_list[0]}: {int(total_calories)}kcal"
    
    return f"Tổng ({', '.join(details)}): {int(total_calories)}kcal"

def interact_with_gemini(user_profile, ingredients_list=None, user_message=None):
    """
    Hàm xử lý chung cho cả việc Gợi ý món ăn (từ ảnh) và Chat tự do.
    - user_profile: Bắt buộc (để AI hiểu ngữ cảnh người dùng).
    - ingredients_list: Nếu có -> Chế độ Phân tích ảnh & Gợi ý món (trả về JSON).
    - user_message: Nếu có (và không có ingredients) -> Chế độ Chat (trả về Text).
    """
    try:
        # 1. Xây dựng Ngữ cảnh chung (System Context) - Dùng cho cả 2 trường hợp
        base_context = f"""
        You are NutriNana, a friendly Vietnamese nutrition assistant.
        
        CURRENT USER PROFILE:
        - BMI: {user_profile.get('bmi', 'N/A')}
        - TDEE: {user_profile.get('tdee', 'N/A')} kcal/day
        - Goal: {user_profile.get('goal', 'Stay healthy')}
        
        Always answer in Vietnamese. Be encouraging and helpful.
        """

        final_prompt = ""
        response_format = "text/plain" 

        # TRƯỜNG HỢP A: CÓ DANH SÁCH NGUYÊN LIỆU (Từ upload ảnh)
        if ingredients_list:
            # Lấy calo từ CSV 
            food_details = [get_calories_from_csv(item) for item in ingredients_list]
            detected_foods_str = ", ".join(food_details)

            # Prompt chuyên biệt cho JSON
            specific_task = f"""
            TASK: Recipe Suggestion based on detected ingredients.
            
            Detected ingredients (raw input):
            {detected_foods_str}

            Your specific tasks:
            1. Calculate total calories from ingredients.
            2. Recommend Vietnamese dishes utilizing these ingredients.
            3. Ensure alignment with user's Goal ({user_profile.get('goal')}).

            OUTPUT RULES:
            - Return ONLY a valid JSON object.
            
            JSON format example:
            {{
                "analysis": "Brief nutrition analysis based on TDEE and ingredients",
                "total_calories": 0,
                "recommendations": [
                    {{
                        "name": "Dish name",
                        "icons": "🍲",
                        "description": "Short explanation why this fits the goal"
                    }}
                ]
            }}
            """
            final_prompt = base_context + "\n" + specific_task
            response_format = "application/json"

        # TRƯỜNG HỢP B: CHAT THÔNG THƯỜNG 
        elif user_message:
            specific_task = f"""
            TASK: Chat / Consultation as "Mimi" - a friendly nutritionist.
            
            User's Question: "{user_message}"
            
            GUIDELINES FOR RESPONSE:
            1. **Format:** Use Markdown formatting to make the text beautiful and readable.
            - Use **bold** for key concepts or numbers.
            - Use bullet points (-) for lists.
            - Use > for important notes.
            2. **Tone:** Friendly, empathetic, and professional. Use emojis (🥗, 💪, ✨, 💧) to make the conversation lively.
            3. **Personalization:** - Current TDEE: {user_profile.get('tdee')} kcal.
            - Goal: {user_profile.get('goal')}.
            - Advise based on these metrics.
            4. **Length:** Keep it concise but sufficient.
            
            Example Output Format:
            "Chào bạn! 🌿 Với mục tiêu **{user_profile.get('goal')}**, bạn nên chú ý:
            - Điều 1...
            - Điều 2...
            Đừng quên uống đủ nước nhé! 💧"
            """
            final_prompt = base_context + "\n" + specific_task
            response_format = "text/plain"
        
        else:
            return {"error": "Không có dữ liệu đầu vào (ảnh hoặc tin nhắn)."}

        # --- LOGGING (Để debug) ---
        print("\n" + "="*50)
        print(f"🚀 [LOG] Gửi Prompt lên Gemini (Mode: {'JSON/Recipe' if ingredients_list else 'Chat'}):")
        print(final_prompt)
        print("="*50 + "\n")
        # --------------------------

        # Gửi request
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=final_prompt,
            config=types.GenerateContentConfig(
                response_mime_type=response_format,
                # Chat thì cần sáng tạo hơn (0.7), JSON cần chính xác (0.1)
                temperature=0.1 if ingredients_list else 0.7 
            )
        )

        # Xử lý kết quả trả về
        result_text = response.text.strip()

        # Nếu là mode JSON (có nguyên liệu) 
        if ingredients_list:
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            return json.loads(result_text)
        
        # Nếu là mode Chat 
        return result_text

    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        if ingredients_list:
            return {"analysis": f"Lỗi AI: {str(e)}", "total_calories": 0, "recommendations": []}
        return "Xin lỗi, Mimi đang bị chóng mặt một chút, bạn hỏi lại sau nhé!"