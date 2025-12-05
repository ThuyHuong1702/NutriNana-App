import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';
import NumberPicker from '@/src/components/NumberPicker';

export default function TargetWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // State
  const [currentWeight, setCurrentWeight] = useState(60);
  const [targetWeight, setTargetWeight] = useState(60);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // 1. Lấy cân nặng hiện tại từ Firebase để làm mốc ban đầu
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.weight) {
            setCurrentWeight(data.weight);
            setTargetWeight(data.weight); // Mặc định đích = hiện tại
          }
        }
      }
      setDataLoaded(true);
    };
    fetchUserData();
  }, []);

  const handleNext = async () => {
    setLoading(true);
    try {
      // 1. Chỉ lưu số cân mong muốn vào Firebase
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          targetWeight: targetWeight
        });
      }
      const goalType = params.goal;
      // 2. Chuyển sang màn hình tiếp theo: Tốc độ giảm cân (Speed)
      // KHÔNG tính toán gì ở đây cả
      if (goalType === 'maintain') {
      // Nếu giữ cân -> Bỏ qua màn Speed, đi thẳng đến Plan
      router.push({ 
        pathname: '/(onboarding)/plan', 
        params: { ...params, targetWeight: targetWeight, weightSpeed: 0 } // Tốc độ = 0
      } as any);
    } else {
      // Nếu Tăng hoặc Giảm -> Đi đến màn Speed
      router.push({ 
        pathname: '/(onboarding)/speed', 
        params: { ...params, targetWeight: targetWeight } 
      } as any);
    }

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        {/* Progress 6/7 ~ 85% */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '85%' }]} />
        </View>
        <Text style={styles.stepText}>6/7</Text>
      </View>

      {/* 2. Tiêu đề */}
      <Text style={styles.title}>Bạn mong muốn có mức cân bao nhiêu kg?</Text>

      {/* 3. Bộ chọn Cân nặng */}
      {dataLoaded ? (
        <View style={styles.pickerContainer}>
          <NumberPicker 
            min={30} max={150} 
            initialValue={Math.round(currentWeight)} 
            unit="Kg" 
            onValueChange={setTargetWeight} 
          />
        </View>
      ) : (
        <View style={styles.pickerContainer}>
          <ActivityIndicator size="large" color="#FDD835" />
        </View>
      )}

      {/* 4. Nút Tiếp theo */}
      <TouchableOpacity 
        style={styles.nextButton} 
        onPress={handleNext} 
        disabled={loading || !dataLoaded}
      >
        {loading ? (
          <ActivityIndicator color="#333" />
        ) : (
          <Text style={styles.btnText}>Tiếp theo</Text>
        )}
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#FFF9C4', borderRadius: 3, marginHorizontal: 15 },
  progressFill: { height: '100%', backgroundColor: '#FDD835', borderRadius: 3 },
  stepText: { color: '#999', fontWeight: 'bold' },
  
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 40, marginBottom: 50, color: '#333' },
  
  pickerContainer: { flex: 1, justifyContent: 'center' },
  
  nextButton: { backgroundColor: '#FDD835', padding: 16, borderRadius: 30, alignItems: 'center', marginBottom: 30 },
  btnText: { fontWeight: 'bold', fontSize: 18, color: '#333' }
});