//app/(onboarding)/gender.tsx
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';

const { width } = Dimensions.get('window');

export default function GenderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [gender, setGender] = useState<string | null>(null);

  const handleNext = async () => {
    if (!gender) return;

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          gender: gender
        });
      }
      
      // Chuyển sang màn hình tiếp theo (Chỉ số cơ thể - Physical)
      // Bạn cần tạo file physical.tsx sau bước này
    router.push({ 
      pathname: '/(onboarding)/age', 
      params: { ...params, gender } 
    } as any);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. Header: Back + Progress Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        {/* Thanh tiến trình màu vàng */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: '15%' }]} /> 
        </View>
        <Text style={styles.stepText}>1/7</Text>
      </View>

      {/* 2. Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Giới tính sinh học của bạn là gì?</Text>

        <View style={styles.selectionContainer}>
          
          {/* Lựa chọn NAM */}
          <TouchableOpacity 
            style={styles.optionWrapper} 
            onPress={() => setGender('male')}
            activeOpacity={0.8}
          >
            <View style={[
              styles.circle, 
              gender === 'male' && styles.selectedCircle
            ]}>
              {/* 👇 DÙNG ICON NAM TẠI ĐÂY */}
              <Ionicons name="male" size={60} color={gender === 'male' ? '#FDD835' : '#CCC'} />
              
              {gender === 'male' && (
                <View style={styles.checkMark}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </View>
            <Text style={[styles.label, gender === 'male' && styles.selectedLabel]}>Nam</Text>
          </TouchableOpacity>

          {/* Lựa chọn NỮ */}
          <TouchableOpacity 
            style={styles.optionWrapper} 
            onPress={() => setGender('female')}
            activeOpacity={0.8}
          >
            <View style={[
              styles.circle, 
              gender === 'female' && styles.selectedCircle
            ]}>
              {/* 👇 DÙNG ICON NỮ TẠI ĐÂY */}
              <Ionicons name="female" size={60} color={gender === 'female' ? '#FDD835' : '#CCC'} />
              
              {gender === 'female' && (
                <View style={styles.checkMark}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </View>
            <Text style={[styles.label, gender === 'female' && styles.selectedLabel]}>Nữ</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* 3. Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, !gender && styles.disabledButton]} 
          onPress={handleNext}
          disabled={!gender}
        >
          <Text style={[styles.btnText, !gender && {color: '#999'}]}>Tiếp theo</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  backBtn: {
    padding: 5,
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#FFF9C4', // Màu nền thanh progress nhạt
    borderRadius: 4,
    marginHorizontal: 15,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FDD835', // Màu vàng đậm
    borderRadius: 4,
  },
  stepText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
  },
  selectionContainer: {
    alignItems: 'center',
    gap: 40, // Khoảng cách giữa 2 lựa chọn
  },
  optionWrapper: {
    alignItems: 'center',
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F5F5', // Màu xám nhạt khi chưa chọn
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCircle: {
    backgroundColor: '#FFF9C4', // Nền vàng nhạt khi chọn
    borderColor: '#FDD835',     // Viền vàng đậm
  },
  genderImage: {
    width: 80,
    height: 80,
  },
  checkMark: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FDD835',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#FDD835',
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    marginBottom: 30,
  },
  nextButton: {
    backgroundColor: '#FDD835',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  btnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});