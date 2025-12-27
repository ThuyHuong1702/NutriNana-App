import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, StatusBar, Image, PixelRatio, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { auth } from '@/src/config/firebase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';//
import { useAudioPlayer } from 'expo-audio';//
import { useLocalSearchParams } from 'expo-router';
import { BACKEND_URL } from '@/src/config/apiConfig';

const { width } = Dimensions.get('window');
// 2. Cấu hình khoảng cách
const CONTAINER_PADDING = 20; // Giả sử padding của màn hình cha là 20
const GAP = 10; // Khoảng cách giữa 2 nút

// 3. Tính toán chiều rộng nút chính xác: (Màn hình - Padding 2 bên - Khoảng giữa) / 2
const BUTTON_WIDTH = (width - (CONTAINER_PADDING * 2) - GAP) / 2;

// 4. Hàm scale font chữ theo màn hình (Tùy chọn, giúp chữ to rõ trên màn to)
const scaleFont = (size: number) => {
  const scale = width / 375; // 375 là chuẩn iPhone X/11
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}


// Danh sách các loại bữa ăn
const MEAL_TYPES = [
  { label: 'Sáng', icon: 'partly-sunny', color: '#FFB300' },
  { label: 'Trưa', icon: 'fast-food', color: '#FB8C00' },
  { label: 'Tối', icon: 'restaurant', color: '#E53935' },
  { label: 'Phụ', icon: 'cafe', color: '#8D6E63' },
  { label: 'Vận động', icon: 'barbell', color: '#43A047' },
];

// Tỷ lệ calo khuyến nghị cho từng bữa
const MEAL_RATIOS: {[key: string]: number} = {
  'Sáng': 0.25, // 25%
  'Trưa': 0.35, // 35%
  'Tối': 0.30,  // 30%
  'Phụ': 0.10,  // 10%
};

// Danh sách bữa ăn để duyệt render thẻ chi tiết (không bao gồm Vận động)
const MEAL_LIST = ['Sáng', 'Trưa', 'Tối', 'Phụ'];

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 3. Thêm useEffect để lắng nghe khi có params gửi về
  useEffect(() => {
      if (params.date) {
          // Nếu có ngày gửi về, cập nhật state selectedDate
          const newDate = new Date(params.date as string);
          setSelectedDate(newDate);
          
          // fetchData(newDate); 
      }
  }, [params.date]);
  // const [waterFavs, setWaterFavs] = useState([]);
  const [waterFavs, setWaterFavs] = useState<any[]>([]);
    // Tự động tải file và giữ trong bộ nhớ
  const player = useAudioPlayer(require('@/assets/sounds/water_drop.mp3'));
  const playWaterSound = () => {
    console.log("Status player:", player); // 👇 In ra xem player có null không
    if (player) {
        console.log("Đang phát nhạc...");
        player.seekTo(0);
        player.play();
    } else {
        console.log("Lỗi: Player chưa sẵn sàng");
    }
  };

  const insets = useSafeAreaInsets();
  // 👇 1. STATE QUẢN LÝ NGÀY ĐANG CHỌN
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // State hiển thị Modal chọn ngày (nếu dùng DateTimePicker)
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // State tổng hợp (Summary)
  const [consumed, setConsumed] = useState({
    calories: 0, carbs: 0, protein: 0, fat: 0, burned: 0, water: 0
  });

  // State lưu danh sách chi tiết các món đã ăn (Logs)
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);


  const [expandedMeals, setExpandedMeals] = useState<{[key: string]: boolean}>({});

  // Hàm toggle trạng thái mở rộng
  const toggleMealExpansion = (mealLabel: string) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealLabel]: !prev[mealLabel]
    }));
  };

  // 1. Lấy thông tin Profile (Mục tiêu)
  const fetchProfile = async () => {
    try {
      if (!auth.currentUser) return;
      const response = await axios.get(`${BACKEND_URL}/api/get-profile/${auth.currentUser.uid}`);
      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.log("Lỗi lấy profile:", error);
    }
  };

  // --- LOGIC NGÀY THÁNG ---
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentDateToday = isToday(selectedDate);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    // Chặn không cho next nếu vượt quá hôm nay
    if (days > 0 && newDate > new Date()) return;
    setSelectedDate(newDate);
  };

  const formatDateForAPI = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  
  // 2. Fetch Data (Logs & Summary)
  const fetchData = async (dateInput?: Date) => {
    try {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      const targetDate = dateInput || selectedDate; 
      const dateStr = formatDateForAPI(selectedDate);
      
      const [summaryRes, logRes, waterRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/get-daily-summary/${uid}?date_str=${dateStr}`),
        axios.get(`${BACKEND_URL}/api/get-daily-log/${uid}?date_str=${dateStr}`),
        axios.get(`${BACKEND_URL}/api/get-water-favorites/${uid}`)
      ]);
      
      if (summaryRes.data.success) {
        const data = summaryRes.data.data;
        setConsumed({
          calories: data.consumed_calories || 0,
          carbs: data.consumed_carbs || 0,
          protein: data.consumed_protein || 0,
          fat: data.consumed_fat || 0,
          burned: data.burned_calories || 0,
          water: data.consumed_water || 0,
        });
      }
      if (logRes.data.success && Array.isArray(logRes.data.data)) {
        setDailyLogs(logRes.data.data);
      } else {
        setDailyLogs([]);
      }
      if (waterRes.data.success) {
        setWaterFavs(waterRes.data.data.slice(0, 4));
      }
    } catch (error) { console.log("Lỗi data:", error); }
  };

  // --- USE EFFECTS ---
  // 1. Chỉ chạy 1 lần khi mở app: Lấy Profile
  useEffect(() => {
    fetchProfile(); 
  }, []);

  // 2. Lắng nghe params từ trang Detail trả về (nếu có)
  useEffect(() => {
      if (params.date) {
          const returnedDate = new Date(params.date as string);
          setSelectedDate(returnedDate); 
      }
  }, [params.date]);

  // 3. TỰ ĐỘNG GỌI API KHI NGÀY THAY ĐỔI (Đây là cái bạn thiếu)
  useEffect(() => {
      fetchData(); 
  }, [selectedDate]);

  // 4. Hàm xử lý khi ấn vào Header Uống nước
  const handleOpenWaterDetail = () => {
      router.push({
          pathname: '/water-detail',
          params: { 
              initialDate: selectedDate.toISOString() 
          }
      });
  };

  // 2. HÀM LOG NƯỚC NHANH
  const handleQuickLogWater = async (item: any) => {
      playWaterSound();
      try {
          const payload = {
              uid: auth.currentUser?.uid,
              w_id: item.W_ID,
              amount_ml: item.DEFAULT_VOLUME,
              date_str: formatDateForAPI(selectedDate)
          };
          
          const res = await axios.post(`${BACKEND_URL}/api/log-water`, payload);
          if (res.data.success) {
              fetchData();
          }
      } catch (e) {
          console.log("Lỗi log nước:", e);
      }
  };
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchData()]);
    setRefreshing(false);
  }, [selectedDate]);

  // --- TÍNH TOÁN CHỈ SỐ ---
  const targetCalo = profile?.DAILY_CALORIE || 2000;
  const targetWater = (profile?.DAILY_WATER_L || 2) * 1000;

  // Tính Macro Mục tiêu
  const targetCarbs = Math.round((targetCalo * 0.5) / 4);
  const targetProtein = Math.round((targetCalo * 0.3) / 4);
  const targetFat = Math.round((targetCalo * 0.2) / 9);

  // Công thức: Còn lại = Mục tiêu - Đã ăn + Vận động
  const remainingCalo = Math.round(targetCalo - consumed.calories + consumed.burned);

  // --- HÀM RENDER THẺ CHI TIẾT BỮA ĂN
  const renderMealDetailCard = (mealLabel: string) => {
    // 1. Lọc các món ăn thuộc bữa này
    const foodsInMeal = dailyLogs.filter(item => item.meal_label === mealLabel);
    

    if (foodsInMeal.length === 0) return null;
    
    // 2. Tính toán chỉ số cho thẻ
    const currentCalo = foodsInMeal.reduce((sum, item) => sum + (item.LOG_CAL || 0), 0);
    const targetMealCalo = Math.round(targetCalo * (MEAL_RATIOS[mealLabel] || 0));
    
    // 3. Logic màu sắc (Vượt quá -> Đỏ, Chưa đủ -> Vàng)
    const isOverLimit = currentCalo > targetMealCalo;
    const badgeBgColor = isOverLimit ? 'rgba(229, 57, 53, 0.2)' : 'rgba(253, 216, 53, 0.2)'; 
    const badgeBorderColor = isOverLimit ? '#E53935' : '#FDD835'; 
    const badgeTextColor = isOverLimit ? '#E53935' : '#FBC02D'; 

    // 4. Logic Thu gọn / Mở rộng
    const isExpanded = expandedMeals[mealLabel] || false;
    const shouldShowButton = foodsInMeal.length > 2;
    const displayedFood = isExpanded ? foodsInMeal : foodsInMeal.slice(0, 2);

    
    return (
      <View style={styles.mealDetailCard} key={mealLabel}>
        {/* Header của Card: Tên bữa + Badge Calo */}
        <View style={styles.mealHeader}>
          <Text style={styles.mealTitle}>Bữa {mealLabel.toLowerCase()}</Text>
          
          <TouchableOpacity 
             style={[styles.caloBadge, { backgroundColor: badgeBgColor, borderColor: badgeBorderColor }]}
             onPress={() => router.push({ pathname: '/meal-detail', params: { meal: mealLabel, date: formatDateForAPI(selectedDate) } } as any)}
          >
            <Text style={[styles.caloBadgeText, { color: badgeTextColor }]}>
              {Math.round(currentCalo)}/{targetMealCalo}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={badgeTextColor} style={{marginLeft: 4}}/>
          </TouchableOpacity>
        </View>

        {/* Danh sách món ăn */}
        <View style={styles.foodList}>
          {displayedFood.map((item, index) => {
              // Xử lý ảnh
              let imgSource = require('@/assets/images/react-logo.png'); 
              if (item.IMAGE_PATH) {
                 imgSource = item.IMAGE_PATH.startsWith('http') 
                   ? { uri: item.IMAGE_PATH } 
                   : { uri: `${BACKEND_URL}/${item.IMAGE_PATH}` };
              }

              return (
                <View key={index} style={styles.foodItem}>
                  <Image source={imgSource} style={styles.foodImage} />
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={2}>{item.DISH_NAME}</Text>
                    <Text style={styles.foodSub}>
                      {Math.round(item.LOG_CAL)} calo • {item.QUANTITY} {item.UNIT || 'phần'}
                    </Text>
                  </View>
                </View>
              );
            })}

          {/* Nút Xem toàn bộ / Thu gọn */}
            <TouchableOpacity 
              style={styles.viewAllBtn}
              onPress={() => toggleMealExpansion(mealLabel)}
            >
              <Text style={styles.viewAllText}>
                {isExpanded ? "Thu gọn" : "Xem toàn bộ"}
              </Text>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#888" 
                style={{marginLeft: 4}}
              />
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#333" />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* --- HEADER --- */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 20, 50) }]}>
          <View style={styles.topBar}>
            <Text style={styles.headerTitle}>{isCurrentDateToday ? "Hôm nay" : `Ngày ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}`}</Text>
            
            <View style={styles.datePicker}>
              {/* Nút Lùi Ngày */}
              <TouchableOpacity onPress={() => changeDate(-1)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name="chevron-back" size={20} color="#333" />
              </TouchableOpacity>
              
              <View style={{flexDirection:'row', alignItems:'center', marginHorizontal: 10}}>
                <Ionicons name="calendar-outline" size={18} color="#333" style={{marginRight:5}}/>
                <Text style={styles.dateText}>{selectedDate.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}</Text>
              </View>

              {/* Nút Tiến Ngày: Disable nếu là hôm nay */}
              <TouchableOpacity 
                onPress={() => changeDate(1)} 
                disabled={isCurrentDateToday} 
                hitSlop={{top:10, bottom:10, left:10, right:10}}
              >
                <Ionicons name="chevron-forward" size={20} color={isCurrentDateToday ? "rgba(0,0,0,0.1)" : "#333"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Summary Circle */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{Math.round(consumed.calories)}</Text>
              <Text style={styles.summaryLabel}>Đã nạp</Text>
            </View>

            <HomeCalorieCircle 
                target={targetCalo} 
                consumed={consumed.calories} 
                remaining={remainingCalo} 
            />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{Math.round(consumed.burned)}</Text>
              <Text style={styles.summaryLabel}>Đã đốt</Text>
            </View> 
          </View>

          {/* Macro Progress Bars */}
          <View style={styles.macroRow}>
            
            {/* --- Carbs --- */}
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${Math.min((consumed.carbs/targetCarbs)*100, 100)}%`, 
                      backgroundColor: consumed.carbs > targetCarbs ? '#E53935' : '#4CAF50' 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
                <Text style={{ color: consumed.carbs > targetCarbs ? '#E53935' : '#4CAF50' }}>
                  {Math.round(consumed.carbs)}
                </Text>
                /{targetCarbs}
              </Text>
            </View>

            {/* --- Protein --- */}
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${Math.min((consumed.protein/targetProtein)*100, 100)}%`,
                      backgroundColor: consumed.protein > targetProtein ? '#E53935' : '#4CAF50' 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
                <Text style={{ color: consumed.protein > targetProtein ? '#E53935' : '#4CAF50' }}>
                  {Math.round(consumed.protein)}
                </Text>
                /{targetProtein}
              </Text>
            </View>

            {/* --- Fat --- */}
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${Math.min((consumed.fat/targetFat)*100, 100)}%`,
                      backgroundColor: consumed.fat > targetFat ? '#E53935' : '#4CAF50' 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
                <Text style={{ color: consumed.fat > targetFat ? '#E53935' : '#4CAF50' }}>
                  {Math.round(consumed.fat)}
                </Text>
                /{targetFat}
              </Text>
            </View>

          </View>
        </View>

          
        {/* --- NHẬT KÝ CALO --- */}
        <View style={styles.darkCard}>
          <Text style={styles.cardTitle}>Nhật ký calo</Text>
          
          {/* Grid phép tính */}
          <View style={styles.calorieGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Còn lại</Text>
              <Text style={[styles.gridValue, {color: '#ffffffff', fontSize: 18}]} numberOfLines={1} adjustsFontSizeToFit>{remainingCalo}</Text>
            </View>
            <Text style={styles.equalSign}>=</Text>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Mục tiêu</Text>
              <Text style={styles.gridValue} numberOfLines={1} adjustsFontSizeToFit>{targetCalo}</Text>
            </View>
            <Text style={styles.minusSign}>-</Text>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Đã ăn</Text>
              <Text style={styles.gridValue} numberOfLines={1} adjustsFontSizeToFit>{Math.round(consumed.calories)}</Text>
            </View>
            <Text style={styles.minusSign}>+</Text> 
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Vận động</Text>
              <Text style={styles.gridValue} numberOfLines={1} adjustsFontSizeToFit>{Math.round(consumed.burned)}</Text>
            </View>
          </View>

          {/* Hàng nút bấm (Sáng, Trưa, Tối, Phụ, Vận động) */}
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((meal, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.mealBtn}
                onPress={() => {
                  if (meal.label === 'Vận động') {
                    router.push({
                      pathname: '/add-exercise',
                      params: {date: formatDateForAPI(selectedDate) }
                    } as any)
                  } else {
                    router.push({
                      pathname: '/add-food',
                      params: { meal: meal.label, date: formatDateForAPI(selectedDate) } 
                    } as any);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={meal.label}
              >
                <View style={[styles.mealIcon, { backgroundColor: meal.color + '20' }]}> 
                  <Ionicons name={meal.icon as any} size={22} color={meal.color} />
                </View>
                <Text style={styles.mealText} numberOfLines={1} adjustsFontSizeToFit>{meal.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- UỐNG NƯỚC --- */}
        <View style={[styles.darkCard, {marginBottom: 20}]}> 
             <TouchableOpacity 
                style={styles.waterHeader} 
                onPress={handleOpenWaterDetail}
            >
                <Text style={styles.cardTitle}>Uống nước</Text>
                <Text style={styles.waterTarget}>
                    {consumed.water || 0}/{targetWater} ml {'>'}
                </Text>
            </TouchableOpacity>

             <ScrollView 
                 horizontal={true} 
                 showsHorizontalScrollIndicator={false} 
                 contentContainerStyle={styles.waterScrollContent} 
                 style={{ marginTop: 10 }} 
             >
                 {waterFavs.length > 0 ? (
                     waterFavs.map((btn, index) => {
                         let imgSource = require('@/assets/images/react-logo.png');
                         if (btn.IMAGE_PATH) {
                             imgSource = btn.IMAGE_PATH.startsWith('http') 
                                 ? { uri: btn.IMAGE_PATH } 
                                 : { uri: `${BACKEND_URL}/${btn.IMAGE_PATH}` };
                         }

                         return (
                             <TouchableOpacity 
                                key={index} 
                                style={styles.waterBtn} 
                                onPress={() => handleQuickLogWater(btn)}
                             >
                                <Image source={imgSource} style={styles.waterImg} resizeMode="contain" />
                                
                                <View style={styles.textContainer}> 
                                    <Text style={styles.waterBtnText} numberOfLines={1} adjustsFontSizeToFit>
                                        {btn.drink_name}
                                    </Text>
                                    <Text style={styles.waterSubText}>{btn.DEFAULT_VOLUME} ml</Text>
                                </View>
                                
                                <Ionicons name="add-circle" size={20} color="#4CAF50" />
                             </TouchableOpacity>
                         );
                     })
                 ) : (
                     <Text style={{color: '#BBB', fontStyle: 'italic', padding: 10}}>
                        Chưa thiết lập đồ uống yêu thích
                     </Text>
                 )}
             </ScrollView>
        </View>

        {/* --- CHI TIẾT BỮA ĂN (CÁC THẺ CARD MÀU XÁM) --- */}
        {dailyLogs.length > 0 && (
          <View style={styles.detailsContainer}>
             <Text style={styles.sectionTitle}>Chi tiết bữa ăn</Text>
             {MEAL_LIST.map(meal => renderMealDetailCard(meal))}
          </View>
        )}

      </ScrollView>


    </View>
  );
}


const HomeCalorieCircle = ({ target, consumed, remaining }: any) => {
  const radius = 65; 
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const size = radius * 2 + strokeWidth;
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver = remaining < 0;
  const progressColor = isOver ? '#E53935' : '#4CAF50'; 
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Lớp 1: SVG vẽ vòng tròn */}
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size/2}, ${size/2}`}>
          <Circle
            cx={size/2} cy={size/2} r={radius}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size/2} cy={size/2} r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Lớp 2: Nội dung chữ ở giữa (Dùng style innerCircle mới) */}
      <View style={styles.innerCircle}>
        <Text 
          style={[styles.circleBigNum, { color: isOver ? '#E53935' : '#333' }]} 
          numberOfLines={1} 
          adjustsFontSizeToFit 
          minimumFontScale={0.5} 
        >
          {remaining}
        </Text>
        <Text 
          style={styles.circleLabel}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
            {isOver ? 'Vượt mức' : 'Cần nạp'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 20 },
  
  // Header Styles
  header: { 
    backgroundColor: '#FDD835', 
    paddingHorizontal: 20, 
    paddingBottom: 30, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    marginBottom: 20 
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  datePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', padding: 5, borderRadius: 20 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#333' },
  
  // Summary Styles
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  summaryItem: { flex: 1, alignItems: 'center' }, // flexible width
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  summaryLabel: { fontSize: 12, color: '#555' },

  innerCircle: { 
    position: 'absolute', 
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '10%',
  },
  
  circleBigNum: { 
    fontSize: 28,
    fontWeight: 'bold', 
    color: '#333',
    textAlign: 'center',
    width: '100%',
  },
  
  circleLabel: { 
    fontSize: 14, 
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },

  // Macro Styles
  macroRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 8, 
    marginTop: 10
  },
  
  macroItem: { 
    flex: 1,
    alignItems: 'center',
  },
  
  macroLabel: { 
    fontSize: 13, 
    color: '#444', 
    marginBottom: 5,
    fontWeight: '500'
  },
  
  progressBarBg: { 
    width: '100%', 
    height: 6,   
    backgroundColor: 'rgba(0,0,0,0.05)', 
    borderRadius: 3, 
    marginBottom: 5,
    overflow: 'hidden' 
  },
  
  progressBarFill: { 
    height: '100%', 
    borderRadius: 3 
  },
  
  macroValue: { 
    fontSize: 12, 
    fontWeight: '600',
    textAlign: 'center'
  },

  // Dark Card & Grid
  darkCard: { backgroundColor: '#333', borderRadius: 20, padding: 20, marginHorizontal: 20, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  calorieGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#555', borderRadius: 15, padding: 15 },
  gridItem: { flex: 1, alignItems: 'center' },
  gridLabel: { fontSize: 12, color: '#aaa', marginBottom: 5 },
  gridValue: { fontSize: 16, fontWeight: 'bold', color: '#eee' },
  equalSign: { fontSize: 20, color: '#aaa', paddingHorizontal: 4 },
  minusSign: { fontSize: 20, color: '#aaa', paddingHorizontal: 4 },

  // Meal Buttons Row
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }, 
  mealBtn: { alignItems: 'center', width: '19%', marginBottom: 10 }, 
  mealIcon: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  mealText: { fontSize: 12, color: '#ccc', fontWeight: '500', textAlign: 'center' },

  // Meal Detail Cards
  detailsContainer: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginLeft: 5 },
  mealDetailCard: { backgroundColor: '#333', borderRadius: 16, padding: 16, marginBottom: 16 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#444', paddingBottom: 12 },
  mealTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  caloBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  caloBadgeText: { fontWeight: 'bold', fontSize: 14 },
  
  // List Food Items
  foodList: { marginTop: 4 },
  foodItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  foodImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#555', marginRight: 12 },
  foodInfo: { flex: 1 },
  foodName: { color: '#FFF', fontSize: 14, fontWeight: '500', marginBottom: 2, flexWrap: 'wrap' }, 
  foodSub: { color: '#AAA', fontSize: 12 },
  
  // View All Button
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 5, borderTopWidth: 1, borderTopColor: '#444' },
  viewAllText: { color: '#CCC', fontSize: 13, fontWeight: '500' },

  // Water Styles
  waterHeader: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 
  },
  waterTarget: { color: '#ccc', fontSize: 14 },
  

  waterScrollContent: {
      paddingRight: 20, 
      gap: 12 
  },

  waterBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#444', 
      padding: 12, 
      borderRadius: 14, 
      width: width * 0.65, 
      
      borderWidth: 1, 
      borderColor: '#555',
  },
  
  waterImg: { 
      width: 40, 
      height: 40, 
      marginRight: 10 
  },
  
  textContainer: { flex: 1 }, 
  
  waterBtnText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '700' 
  },
  
  waterSubText: { 
      color: '#AAA', 
      fontSize: 13,
      marginTop: 2 
  }
});