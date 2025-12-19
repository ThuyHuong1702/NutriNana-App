import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';

const GOALS = [
  { id: 'lose', label: 'Giảm cân' },
  { id: 'maintain', label: 'Duy trì cân nặng hiện tại' },
  { id: 'gain', label: 'Tăng cân' },
];

export default function GoalScreen() {
  const router = useRouter();
  
  // 1. Lấy charId từ màn hình trước truyền sang
  const params = useLocalSearchParams(); 
  const { charId } = params;

  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  // 2. Hàm lấy tên nhân vật dựa trên ID
  const getCharacterName = () => {
    switch (charId) {
      case 'max': return 'Max';
      case 'chuck': return 'Chef Chuck';
      case 'ninja': return 'Lady Na';
      case 'baby': return 'Baby Na';
      default: return 'Mimi'; 
    }
  };

  const handleNext = async () => {
    if (!selectedGoal) return;

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          goal: selectedGoal
        });
      }
      
      router.push({ 
        pathname: '/(onboarding)/prepare', 
        params: { ...params, goal: selectedGoal } 
      } as any);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Tiêu đề */}
        <Text style={styles.title}>
          Bạn muốn theo dõi ăn uống để đạt được điều gì?
        </Text>
        
        <Text style={styles.subtitle}>
          <Text style={{fontWeight: 'bold', color: '#F9A825'}}>{getCharacterName()}</Text> sẽ xây dựng kế hoạch dựa trên nhu cầu của bạn
        </Text>

        {/* Danh sách lựa chọn */}
        <View style={styles.optionsContainer}>
          {GOALS.map((item) => {
            const isSelected = selectedGoal === item.id;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.optionCard, 
                  isSelected && styles.selectedCard 
                ]}
                onPress={() => setSelectedGoal(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                
                <Text style={[styles.optionText, isSelected && styles.selectedText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Nút Tiếp theo */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.nextButton, !selectedGoal && styles.disabledButton]} 
            onPress={handleNext}
            disabled={!selectedGoal}
          >
            <Text style={styles.btnText}>Tiếp theo</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15, 
    color: '#666',
    marginBottom: 40,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 15, 
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FDD835', 
    backgroundColor: '#fff',
  },
  selectedCard: {
    backgroundColor: '#FDD835', 
    borderColor: '#FDD835',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FDD835', 
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedRadio: {
    borderColor: '#fff', 
    backgroundColor: '#fff', 
  },
  radioDot: {
    //
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedText: {
    fontWeight: 'bold',
    color: '#333', 
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
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
    backgroundColor: '#EEE', 
  },
  btnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});