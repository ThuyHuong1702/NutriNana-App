// app/(onboarding)/weight.tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';
import NumberPicker from '@/src/components/NumberPicker';

export default function WeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [weightVal, setWeightVal] = useState(60); 

  const handleNext = async () => {
    // 1. Thêm validation kiểm tra cân nặng hợp lý
    if (weightVal < 30 || weightVal > 200) {
      Alert.alert("Cân nặng không hợp lý", "Vui lòng chọn cân nặng thực tế (30kg - 200kg).");
      return;
    }

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { weight: weightVal });
      }
      router.push({ 
        pathname: '/(onboarding)/activity', 
        params: { ...params, weight: weightVal } 
      } as any);

    } catch (error) { 
      console.log(error); 
      Alert.alert("Lỗi", "Không thể lưu dữ liệu.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Cân nặng hiện tại của bạn?</Text>

          <View style={styles.pickerWrapper}>
            <NumberPicker 
              min={30} 
              max={200} 
              initialValue={60} 
              unit="Kg" 
              onValueChange={setWeightVal} 
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.btnText}>Tiếp theo</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 20 
  },

  header: { 
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  backBtn: {
    padding: 5,
  },

  contentContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',     
    paddingBottom: 20,
  },

  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 30, 
    color: '#333',
    maxWidth: '90%', 
  },
  
  pickerWrapper: { 
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },

  footer: {
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  nextButton: { 
    backgroundColor: '#FDD835', 
    paddingVertical: 16, 
    borderRadius: 30, 
    alignItems: 'center', 
    width: '100%',
  },
  btnText: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    color: '#333' 
  }
});