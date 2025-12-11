//app/(onboarding)/plan.tsx
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { auth } from '@/src/config/firebase';

const { width } = Dimensions.get('window');

// 👇 Thay IP máy tính của bạn
const BACKEND_URL = 'http://192.168.1.3:8000'; 

export default function PlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Animation values cho 4 thanh tiến trình
  const progress1 = useRef(new Animated.Value(0)).current;
  const progress2 = useRef(new Animated.Value(0)).current;
  const progress3 = useRef(new Animated.Value(0)).current;
  const progress4 = useRef(new Animated.Value(0)).current;

  // Hàm chạy animation cho 1 thanh
  const animateProgress = (animValue: Animated.Value, duration: number) => {
    return new Promise((resolve) => {
      Animated.timing(animValue, {
        toValue: 100,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: false, // width không hỗ trợ native driver
      }).start(() => resolve(true));
    });
  };

  // Chạy chuỗi animation khi vào màn hình
  useEffect(() => {
    const runAnimations = async () => {
      await animateProgress(progress1, 1000); // Bước 1: 1s
      await animateProgress(progress2, 1500); // Bước 2: 1.5s
      await animateProgress(progress3, 1200); // Bước 3: 1.2s
      await animateProgress(progress4, 800);  // Bước 4: 0.8s
      setCompleted(true); // Hiện nút bấm
    };
    runAnimations();
  }, []);

  const handleStart = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);

    try {
      // 1. Chuẩn bị dữ liệu gửi đi
      const payload = {
        firebase_id: auth.currentUser.uid,
        email: auth.currentUser.email || "",
        nickname: params.nickname as string || "User",
        character_id: params.charId as string || "mimi",
        gender: params.gender as string,
        age: parseInt(params.age as string) || 20,
        height: parseFloat(params.height as string) || 160,
        weight: parseFloat(params.weight as string) || 50,
        activity_level: parseFloat(params.activityLevel as string) || 1.2,
        goal_type: params.goal as string || "maintain",
        target_weight: parseFloat(params.targetWeight as string) || 50,
        weight_speed: parseFloat(params.weightSpeed as string) || 0.5
      };

      console.log("🚀 Đang gửi dữ liệu:", payload);

      // 2. Gửi sang Python để tính toán & lưu MySQL
      await axios.post(`${BACKEND_URL}/api/save-profile`, payload);
      
      // 3. Chuyển vào trang chủ
      router.replace('/(onboarding)/result');

    } catch (error) {
      console.log("Lỗi lưu:", error);
      // Vẫn cho vào trang chủ dù lỗi server (để user không bị kẹt)
      router.replace('/(onboarding)/result');
    } finally {
      setIsSaving(false);
    }
  };

  // Component thanh tiến trình con
  const ProgressBarItem = ({ label, animValue }: { label: string, animValue: Animated.Value }) => {
    const widthInterpolated = animValue.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    const [percent, setPercent] = useState(0);
    
    // Lắng nghe giá trị để hiện số %
    useEffect(() => {
      const id = animValue.addListener(({ value }) => {
        setPercent(Math.round(value));
      });
      return () => animValue.removeListener(id);
    }, []);

    return (
      <View style={styles.progressItem}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {percent >= 100 ? (
            <Ionicons name="checkmark-circle" size={20} color="#FDD835" />
          ) : (
            <Text style={styles.percentText}>{percent}%</Text>
          )}
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: widthInterpolated }]} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <Text style={styles.title}>
          Cảm ơn bạn, {params.nickname || "bạn"} đã có đủ thông tin!
        </Text>
        <Text style={styles.subtitle}>
          AI sẽ nhanh chóng thiết lập lập kế hoạch sức khỏe cho bạn
        </Text>

        <View style={styles.progressList}>
          <ProgressBarItem label="Thiết lập hồ sơ cá nhân" animValue={progress1} />
          <ProgressBarItem label="Tính toán tỉ lệ dinh dưỡng" animValue={progress2} />
          <ProgressBarItem label="Khuyến nghị cá nhân hóa" animValue={progress3} />
          <ProgressBarItem label="Xây dựng lộ trình" animValue={progress4} />
        </View>

      </View>

      {/* Nút Hoàn tất (Chỉ hiện khi chạy xong 4 thanh) */}
      <View style={styles.footer}>
        {completed && (
          <TouchableOpacity style={styles.btn} onPress={handleStart} disabled={isSaving}>
            <Text style={styles.btnText}>
              {isSaving ? "Đang lưu..." : "Xem kết quả"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10, lineHeight: 30 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 40 },

  progressList: { gap: 25 },
  progressItem: {},
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, color: '#555', fontWeight: '500' },
  percentText: { fontSize: 12, color: '#999' },
  
  track: { 
    height: 8, 
    backgroundColor: '#FFF9C4', // Vàng nhạt nền
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  fill: { 
    height: '100%', 
    backgroundColor: '#FDD835', // Vàng đậm
    borderRadius: 4 
  },

  footer: { padding: 24, paddingBottom: 40 },
  btn: { 
    backgroundColor: '#FDD835', 
    paddingVertical: 16, 
    borderRadius: 30, 
    alignItems: 'center',
    shadowColor: "#FDD835",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  btnText: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});