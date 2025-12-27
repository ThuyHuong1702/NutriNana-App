// app/(onboarding)/gender.tsx
import { 
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';

const { width } = Dimensions.get('window');

const CIRCLE_SIZE = width * 0.4; 

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
      router.push({ 
        pathname: '/(onboarding)/age', 
        params: { ...params, gender } 
      } as any);
    } catch (error) {
      console.log(error);
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
                <Ionicons name="male" size={CIRCLE_SIZE * 0.4} color={gender === 'male' ? '#FDD835' : '#CCC'} />
                
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
                <Ionicons name="female" size={CIRCLE_SIZE * 0.4} color={gender === 'female' ? '#FDD835' : '#CCC'} />
                
                {gender === 'female' && (
                  <View style={styles.checkMark}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={[styles.label, gender === 'female' && styles.selectedLabel]}>Nữ</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.nextButton, !gender && styles.disabledButton]} 
            onPress={handleNext}
            disabled={!gender}
          >
            <Text style={[styles.btnText, !gender && {color: '#999'}]}>Tiếp theo</Text>
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
    paddingHorizontal: 20,
  },

  header: {
    paddingVertical: 10,
  },
  backBtn: {
    padding: 5,
    alignSelf: 'flex-start',
  },
  scrollContent: {
    flexGrow: 1, 
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 40, 
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  selectionContainer: {
    flexDirection: 'column', 
    alignItems: 'center',    
    gap: 30,                 
    width: '100%',
  },
  optionWrapper: {
    alignItems: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,   
    height: CIRCLE_SIZE,  
    borderRadius: CIRCLE_SIZE / 2, 
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCircle: {
    backgroundColor: '#FFF9C4', 
    borderColor: '#FDD835',
  },
  checkMark: {
    position: 'absolute',
    top: 15,  
    right: 15,
    backgroundColor: '#FDD835',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  label: {
    fontSize: 20,
    color: '#999',
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#FDD835',
    fontWeight: 'bold',
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  btnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});