import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { auth } from '@/src/config/firebase';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
// 👇 Thay IP máy tính của bạn
const BACKEND_URL = 'http://192.168.1.3:8000'; 
// Danh sách các bữa ăn và icon tương ứng (Sử dụng Ionicons)
const MEAL_TYPES = [
  { label: 'Sáng', icon: 'partly-sunny', color: '#FFB300' }, // Mặt trời vàng cam
  { label: 'Trưa', icon: 'fast-food', color: '#FB8C00' },    // Burger cam đậm
  { label: 'Tối', icon: 'restaurant', color: '#E53935' },    // Dĩa ăn đỏ
  { label: 'Phụ', icon: 'cafe', color: '#8D6E63' },          // Cốc nước nâu
  { label: 'Vận động', icon: 'barbell', color: '#43A047' },  // Tạ xanh lá
];
export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dữ liệu giả lập cho phần "Đã ăn" (Sau này sẽ lấy từ DB nhật ký)
  const [consumed, setConsumed] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    water: 0
  });

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Tính toán chỉ số mục tiêu
  const targetCalo = profile?.DAILY_CALORIE || 2000;
  const targetWater = (profile?.DAILY_WATER_L || 2) * 1000; // Đổi ra ml

  // Tính Macro (Giả định: 50% Carbs, 30% Protein, 20% Fat)
  // 1g Carb = 4kcal, 1g Protein = 4kcal, 1g Fat = 9kcal
  const targetCarbs = Math.round((targetCalo * 0.5) / 4);
  const targetProtein = Math.round((targetCalo * 0.3) / 4);
  const targetFat = Math.round((targetCalo * 0.2) / 9);

  const remainingCalo = targetCalo - consumed.calories;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDD835" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* --- HEADER MÀU VÀNG --- */}
        <View style={styles.header}>
          {/* Top Bar: Hôm nay & Ngày tháng */}
          <View style={styles.topBar}>
            <Text style={styles.headerTitle}>Hôm nay</Text>
            <View style={styles.datePicker}>
              <TouchableOpacity><Ionicons name="chevron-back" size={20} color="#333" /></TouchableOpacity>
              <View style={{flexDirection:'row', alignItems:'center', marginHorizontal: 10}}>
                <Ionicons name="calendar-outline" size={18} color="#333" style={{marginRight:5}}/>
                <Text style={styles.dateText}>{new Date().toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}</Text>
              </View>
              <TouchableOpacity><Ionicons name="chevron-forward" size={20} color="#333" /></TouchableOpacity>
            </View>
          </View>

          {/* Vòng tròn Calo & Số liệu */}
          <View style={styles.summaryContainer}>
            {/* Bên trái: Đã nạp */}
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{consumed.calories}</Text>
              <Text style={styles.summaryLabel}>Đã nạp</Text>
            </View>

            {/* Giữa: Vòng tròn (Dùng View border để giả lập) */}
            <View style={styles.circleProgress}>
              <View style={styles.innerCircle}>
                <Text style={styles.circleBigNum}>{targetCalo}</Text>
                <Text style={styles.circleLabel}>Cần nạp</Text>
              </View>
            </View>

            {/* Bên phải: Ẩn hoặc thêm thông tin khác nếu muốn */}
            <View style={styles.summaryItem} /> 
          </View>

          {/* Macro Progress Bars */}
          <View style={styles.macroRow}>
            {/* Carbs */}
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(consumed.carbs/targetCarbs)*100}%`, backgroundColor: '#fff' }]} />
              </View>
              <Text style={styles.macroValue}>{consumed.carbs}/{targetCarbs}</Text>
            </View>

            {/* Protein */}
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Chất đạm</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(consumed.protein/targetProtein)*100}%`, backgroundColor: '#fff' }]} />
              </View>
              <Text style={styles.macroValue}>{consumed.protein}/{targetProtein}</Text>
            </View>

            {/* Fat */}
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Chất béo</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(consumed.fat/targetFat)*100}%`, backgroundColor: '#fff' }]} />
              </View>
              <Text style={styles.macroValue}>{consumed.fat}/{targetFat}</Text>
            </View>
          </View>
        </View>

        {/* --- NHẬT KÝ CALO (THẺ ĐEN) --- */}
        <View style={styles.darkCard}>
          <Text style={styles.cardTitle}>Nhật ký calo</Text>
          
          <View style={styles.calorieGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Còn lại</Text>
              <Text style={[styles.gridValue, {color: '#fff'}]}>{remainingCalo}</Text>
            </View>
            <Text style={styles.equalSign}>=</Text>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Mục tiêu</Text>
              <Text style={styles.gridValue}>{targetCalo}</Text>
            </View>
            <Text style={styles.minusSign}>-</Text>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Đã ăn</Text>
              <Text style={styles.gridValue}>{consumed.calories}</Text>
            </View>
            <Text style={styles.minusSign}>-</Text>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Vận động</Text>
              <Text style={styles.gridValue}>0</Text>
            </View>
          </View>

          {/* Các bữa ăn - Đã sửa icon riêng biệt */}
          <View style={styles.mealRow}>
            {MEAL_TYPES.map((meal, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.mealBtn}
                // 👇 Sự kiện chuyển trang
                onPress={() => router.push({
                  pathname: '/add-food',
                  params: { meal: meal.label } // Truyền tên bữa ăn sang
                } as any)}
              >
                {/* Vòng tròn nền icon */}
                <View style={[styles.mealIcon, { backgroundColor: meal.color + '20' }]}> 
                   <Ionicons name={meal.icon as any} size={22} color={meal.color} />
                </View>
                <Text style={styles.mealText}>{meal.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- UỐNG NƯỚC (THẺ ĐEN) --- */}
        <View style={[styles.darkCard, {marginBottom: 100}]}> 
          <View style={styles.waterHeader}>
            <Text style={styles.cardTitle}>Uống nước</Text>
            <Text style={styles.waterTarget}>0/{targetWater} ml {'>'}</Text>
          </View>

          <View style={styles.waterButtons}>
            {/* Nút Nước */}
            <TouchableOpacity style={styles.waterBtn}>
              <View style={styles.waterIconBg}>
                <Ionicons name="water" size={24} color="#29B6F6" />
              </View>
              <Text style={styles.waterBtnText}>Nước (250 ml)</Text>
            </TouchableOpacity>

            {/* Nút Sữa */}
            <TouchableOpacity style={styles.waterBtn}>
              <View style={styles.waterIconBg}>
                <Ionicons name="nutrition" size={24} color="#FF9800" />
              </View>
              <Text style={styles.waterBtnText}>Sữa (250 ml)</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // --- HEADER VÀNG ---
  header: {
    backgroundColor: '#FDD835', // Màu vàng chủ đạo
    paddingTop: 50, // Tránh tai thỏ
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 5,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  
  // Summary Circle
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  summaryItem: {
    width: 60,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#555',
  },
  circleProgress: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', // Màu nền mờ
  },
  innerCircle: {
    alignItems: 'center',
  },
  circleBigNum: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  circleLabel: {
    fontSize: 14,
    color: '#555',
  },

  // Macros
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    width: '30%',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 13,
    color: '#444',
    marginBottom: 5,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  macroValue: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },

  // --- THẺ ĐEN (DARK CARD) ---
  darkCard: {
    backgroundColor: '#333', // Màu nền đen xám
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  
  // Calorie Grid
  calorieGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 15,
    padding: 15,
  },
  gridItem: {
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 5,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#eee',
  },
  equalSign: { fontSize: 20, color: '#aaa' },
  minusSign: { fontSize: 20, color: '#aaa' },

  // Meals
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealBtn: {
    alignItems: 'center',
  },
  mealIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  mealText: {
    fontSize: 12,
    color: '#ccc',
  },

  // Water
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  waterTarget: {
    color: '#ccc',
    fontSize: 14,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: '#FDD835', // Viền vàng nổi bật
  },
  waterIconBg: {
    marginRight: 10,
  },
  waterBtnText: {
    color: '#fff',
    fontSize: 13,
  }
});
