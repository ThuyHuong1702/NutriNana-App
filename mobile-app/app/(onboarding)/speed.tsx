import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

export default function SpeedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const goalType = params.goal; // 'lose', 'gain', 'maintain'

  // 1. CẤU HÌNH DỰA TRÊN MỤC TIÊU
  const config = useMemo(() => {
    if (goalType === 'gain') {
      return {
        title: "Bạn muốn tăng cân nhanh hay chậm?",
        max: 0.5, // Tăng cân max chỉ nên là 0.5kg/tuần
        safeLimit: 0.3,
        labelSafe: "An toàn - Tăng cơ bắp",
        labelFast: "Tăng nhanh - Có thể tích mỡ",
        colorSafe: "#2E7D32", // Xanh lá
        colorFast: "#F57F17"  // Cam đậm (Cảnh báo nhẹ hơn màu đỏ)
      };
    } else {
      // Mặc định là Giảm cân (lose)
      return {
        title: "Bạn muốn giảm cân nhanh hay chậm?",
        max: 1.0,
        safeLimit: 0.7,
        labelSafe: "Dễ dàng - Bền vững",
        labelFast: "Tốc độ cao - Cẩn trọng",
        colorSafe: "#2E7D32",
        colorFast: "#C62828"  // Đỏ (Cảnh báo mạnh)
      };
    }
  }, [goalType]);

  // Tốc độ mặc định ban đầu
  const [speed, setSpeed] = useState(goalType === 'gain' ? 0.2 : 0.5);

  // 2. TÍNH TOÁN TRẠNG THÁI HIỂN THỊ (Màu sắc, lời khuyên)
  const speedStatus = useMemo(() => {
    // Nếu là giữ cân thì không cần tính
    if (goalType === 'maintain') return { text: "Duy trì cân nặng", textColor: "#2E7D32", bgColor: "#E8F5E9", borderColor: "#A5D6A7", isWarning: false };

    const isFast = speed > config.safeLimit;
    
    return {
      text: isFast ? config.labelFast : config.labelSafe,
      textColor: isFast ? config.colorFast : config.colorSafe,
      bgColor: isFast ? (goalType === 'gain' ? "#FFF3E0" : "#FFEBEE") : "#E8F5E9", // Cam nhạt hoặc Đỏ nhạt
      borderColor: isFast ? (goalType === 'gain' ? "#FFCC80" : "#EF9A9A") : "#A5D6A7",
      isWarning: isFast
    };
  }, [speed, config, goalType]);

  const handleNext = () => {
    router.push({
      pathname: '/(onboarding)/plan',
      // Nếu là giữ cân thì speed = 0, ngược lại lấy giá trị slider
      params: { ...params, weightSpeed: goalType === 'maintain' ? 0 : speed.toFixed(1) }
    } as any);
  };

  // Nếu người dùng chọn "Giữ cân" ở bước trước mà lỡ vào đây -> Tự động chuyển tiếp luôn
  useEffect(() => {
    if (goalType === 'maintain') {
        handleNext();
    }
  }, []);

  // Nếu đang là giữ cân thì render màn hình trống trong lúc chuyển trang
  if (goalType === 'maintain') return <View style={{flex:1, backgroundColor:'#fff'}} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: '100%' }]} />
        </View>
        <Text style={styles.stepText}>7/7</Text>
      </View>

      {/* 2. Tiêu đề ĐỘNG */}
      <Text style={styles.title}>{config.title}</Text>

      {/* 3. Gợi ý (Label) ĐỘNG */}
      <View style={[
          styles.recommendationContainer, 
          { 
            backgroundColor: speedStatus.bgColor,
            borderColor: speedStatus.borderColor
          }
        ]}>
        {speedStatus.isWarning && <Ionicons name="warning-outline" size={16} color={speedStatus.textColor} style={{marginRight: 6}} />}
        <Text style={[styles.recommendationText, { color: speedStatus.textColor }]}>
          {speedStatus.text}
        </Text>
      </View>

      {/* 4. Thanh trượt (Slider) */}
      <View style={styles.sliderSection}>
        {/* Bong bóng giá trị */}
        <View style={styles.labelContainer}>
            <View style={[styles.currentValueBubble, { backgroundColor: speedStatus.textColor }]}> 
                <Text style={styles.currentValueText}>{speed.toFixed(1)} kg/tuần</Text>
            </View>
        </View>

        <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={config.max} // Max thay đổi tùy Tăng hay Giảm
              step={0.1}
              value={speed}
              onValueChange={setSpeed}
              // Màu sắc thay đổi theo mức độ an toàn
              minimumTrackTintColor={speedStatus.textColor} 
              maximumTrackTintColor="#ECEFF1"
              thumbTintColor={speedStatus.textColor}
            />
             <Text style={styles.maxValueText}>{config.max} kg</Text>
        </View>
      </View>

      {/* 5. Nút Tiếp theo */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={[styles.nextButton, { backgroundColor: speedStatus.textColor }]} 
            onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Tiếp theo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#FFF9C4',
    borderRadius: 4,
    marginHorizontal: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FDD835',
    borderRadius: 4,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  // Box gợi ý
  recommendationContainer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 40,
    borderWidth: 1,
  },
  recommendationText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sliderSection: {
    marginTop: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  currentValueBubble: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  currentValueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  sliderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginRight: 12,
  },
  maxValueText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 32,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});