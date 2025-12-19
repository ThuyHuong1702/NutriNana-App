//app/(onboarding)/result.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { auth, db } from '@/src/config/firebase';
import { doc, updateDoc } from 'firebase/firestore'; 

const { width } = Dimensions.get('window');

const BACKEND_URL = 'http://192.168.1.3:8000';

export default function ResultScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;
      
      const response = await axios.get(`${BACKEND_URL}/api/get-profile/${uid}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.log("Lỗi lấy data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnboardingCompleted: true 
        });
      }
      router.replace('/(tabs)');
      
    } catch (error) {
      console.log("Lỗi cập nhật trạng thái:", error);
      router.replace('/(tabs)');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FDD835" />
        <Text style={{marginTop: 10, color: '#666'}}>Đang tải kế hoạch...</Text>
      </View>
    );
  }

  if (!data) return null;

  const getGoalInfo = () => {
    switch (data.goal_type || data.GOAL_TYPE) { 
      case 'lose': return { title: 'Giảm cân', desc: 'Năng lượng nạp vào để giảm cân (calo thâm hụt = TDEE - 500)' };
      case 'gain': return { title: 'Tăng cân', desc: 'Năng lượng nạp vào để tăng cân (calo dư thừa = TDEE + 500)' };
      default: return { title: 'Duy trì cân nặng', desc: 'Năng lượng nạp vào để duy trì cân nặng (TDEE)' };
    }
  };  

  // Tính trạng thái BMI
  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return "Thiếu cân";
    if (bmi < 24.9) return "Bình thường";
    if (bmi < 29.9) return "Thừa cân";
    return "Béo phì";
  };

  const goalInfo = getGoalInfo();
  const bmiStatus = getBMIStatus(data.bmi || data.BMI); 

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.avatarContainer}>
             <Image source={require('@/assets/images/banana-muscle.jpg')} style={styles.avatar} resizeMode="contain" />
          </View>
          <Text style={styles.greeting}>
            <Text style={{fontWeight: 'bold'}}>{data.nickname || data.NICKNAME}</Text> ơi, kế hoạch đã sẵn sàng
          </Text>
          <Text style={styles.mainTitle}>{goalInfo.title}</Text>
          <Text style={styles.subTitle}>{goalInfo.desc}</Text>
        </View>

        {/* 1. Card Calo */}
        <View style={styles.card}>
          <View style={styles.caloRow}>
            <View>
              <Text style={styles.bigNumber}>{data.daily_calories || data.DAILY_CALORIE}</Text>
              <Text style={styles.unitText}>Kcal/ngày</Text>
            </View>
            <View style={styles.circleGraph}>
               <Text style={styles.circleText}>{data.daily_calories || data.DAILY_CALORIE}</Text>
               <Text style={{fontSize: 10, color: '#999'}}>Mục tiêu</Text>
            </View>
          </View>
        </View>

        {/* 2. Card BMI */}
        <Text style={styles.sectionLabel}>Chỉ số khối cơ thể (BMI)</Text>
        <View style={styles.card}>
          <View style={styles.bmiHeader}>
            <View>
              <Text style={styles.cardTitle}>BMI</Text>
              <Text style={[styles.bigNumber, {color: '#D32F2F'}]}>{data.bmi || data.BMI}</Text>
            </View>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('vi-VN')}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{data.height || data.HEIGHT_CM} cm</Text>
              <Text style={styles.statLabel}>Chiều cao</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{data.weight || data.WEIGHT_KG} kg</Text>
              <Text style={styles.statLabel}>{bmiStatus}</Text>
            </View>
          </View>
        </View>

        {/* 3. Card Nước */}
        <Text style={styles.sectionLabel}>Bạn nên uống bao nhiêu nước</Text>
        <View style={[styles.card, {backgroundColor: '#FFFDE7'}]}> 
           <Text style={[styles.bigNumber, {color: '#F57F17'}]}>
             {data.DAILY_WATER_L} L
           </Text>
           <Text style={styles.unitText}>Lượng nước bạn cần uống</Text>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleFinish}>
          <Text style={styles.btnText}>Tiếp theo</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  header: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF9C4', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: '#FDD835'
  },
  avatar: { width: 50, height: 60 },
  greeting: { fontSize: 14, color: '#666', marginBottom: 5 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subTitle: { fontSize: 13, color: '#888', textAlign: 'center', paddingHorizontal: 20 },

  card: {
    backgroundColor: '#FFF9C4', 
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  
  caloRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bigNumber: { fontSize: 28, fontWeight: 'bold', color: '#F57F17' }, 
  unitText: { fontSize: 14, color: '#666' },
  circleGraph: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff',
    borderWidth: 3, borderColor: '#FDD835', justifyContent: 'center', alignItems: 'center'
  },
  circleText: { fontSize: 16, fontWeight: 'bold', color: '#888' },

  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 10, marginLeft: 5 },
  bmiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dateText: { fontSize: 12, color: '#888' },
  divider: { height: 1, backgroundColor: '#F0E68C', marginVertical: 15 }, // Vạch kẻ vàng đậm hơn nền
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 13, color: '#666' },

  nextButton: {
    backgroundColor: '#FDD835',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3,
  },
  btnText: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});