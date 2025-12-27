// app/(onboarding)/height.tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';
import NumberPicker from '@/src/components/NumberPicker';

export default function HeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [heightVal, setHeightVal] = useState(170); 

  const handleNext = async () => {
    // 1. Thêm kiểm tra hợp lệ
    if (heightVal < 100 || heightVal > 250) {
      Alert.alert("Chiều cao không hợp lệ", "Vui lòng chọn chiều cao thực tế (100cm - 250cm).");
      return;
    }

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { height: heightVal });
      }
      router.push({ 
        pathname: '/(onboarding)/weight', 
        params: { ...params, height: heightVal } 
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
          <Text style={styles.title}>Chiều cao của bạn là bao nhiêu?</Text>

          <View style={styles.pickerWrapper}>
            <NumberPicker 
              min={100} 
              max={250} 
              initialValue={170} 
              unit="Cm" 
              onValueChange={setHeightVal} 
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
    alignItems: 'center',
    height: 250, 
    justifyContent: 'center',
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