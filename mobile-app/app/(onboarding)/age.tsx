// app/(onboarding)/age.tsx
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';
import NumberPicker from '@/src/components/NumberPicker';

export default function AgeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [age, setAge] = useState(22); 

  const handleNext = async () => {
    if (age < 16 || age > 100) {
      Alert.alert(
        "Độ tuổi không phù hợp", 
        "Ứng dụng chỉ dành cho người dùng từ 16 đến 100 tuổi."
      );
      return; 
    }

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { age: age });
      }
      router.push({ 
        pathname: '/(onboarding)/height', 
        params: { ...params, age } 
      } as any);
    } catch (error) { 
      console.log(error);
      Alert.alert("Lỗi", "Không thể lưu thông tin. Vui lòng thử lại.");
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
          <Text style={styles.title}>Hiện tại bạn bao nhiêu tuổi?</Text>

          <View style={styles.pickerWrapper}>
            <NumberPicker 
              min={16} 
              max={100} 
              initialValue={22} 
              unit="Tuổi" 
              onValueChange={setAge} 
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