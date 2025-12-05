from datetime import date
from app.schemas.profile import OnboardingData

def calculate_metrics(data: OnboardingData):
    # a. Tính ngày sinh (tương đối từ tuổi)
    today = date.today()
    birth_year = today.year - data.age
    dob = date(birth_year, 1, 1)

    # b. Mapping Activity Level sang tên
    lifestyle_map = {
        1.2: "sedentary",
        1.375: "light",
        1.55: "moderate",
        1.725: "active",
        1.9: "very_active"
    }
    lifestyle_name = lifestyle_map.get(data.activity_level, "moderate")

    # c. Tính BMI
    height_m = data.height / 100
    bmi = round(data.weight / (height_m * height_m), 2)

    # d. Tính BMR (Mifflin-St Jeor)
    bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age)
    if data.gender == 'male':
        bmr += 5
    else:
        bmr -= 161
    bmr = round(bmr, 2)

    # e. Tính TDEE
    tdee = round(bmr * data.activity_level, 2)

    # f. Tính Calo khuyến nghị
    calorie_adjustment = (data.weight_speed * 7700) / 7
    
    daily_calorie = tdee
    if data.goal_type == 'lose':
        daily_calorie -= calorie_adjustment
    elif data.goal_type == 'gain':
        daily_calorie += calorie_adjustment
    
    daily_calorie = max(round(daily_calorie, 2), 1200)

    # g. Tính lượng nước (0.033 lít/kg)
    daily_water = round(data.weight * 0.033, 2)

    return {
        "dob": dob,
        "lifestyle_name": lifestyle_name,
        "bmi": bmi,
        "bmr": bmr,
        "tdee": tdee,
        "daily_calorie": daily_calorie,
        "daily_water": daily_water
    }