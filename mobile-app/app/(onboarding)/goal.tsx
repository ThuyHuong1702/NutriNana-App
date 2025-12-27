// app/(onboarding)/goal.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';
import { Ionicons } from '@expo/vector-icons';

const GOALS = [
  { id: 'lose', label: 'Giảm cân', desc: 'Giảm mỡ, giữ cơ, thon gọn vóc dáng' },
  { id: 'maintain', label: 'Duy trì cân nặng hiện tại', desc: 'Cải thiện sức khỏe, giữ vóc dáng' },
  { id: 'gain', label: 'Tăng cân', desc: 'Tăng cơ, cải thiện vóc dáng' },
];

export default function GoalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const { charId } = params;

  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    if (!selectedId) return;

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          goal: selectedId
        });
      }

      router.push({
        pathname: '/(onboarding)/prepare', 
        params: { ...params, goal: selectedId } 
      } as any);

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            Bạn muốn theo dõi ăn uống để đạt được điều gì?
          </Text>
          
          <Text style={styles.subtitle}>
            <Text style={{fontWeight: 'bold', color: '#F9A825'}}>{getCharacterName()}</Text> sẽ xây dựng kế hoạch dựa trên nhu cầu của bạn
          </Text>

          <View style={styles.optionsContainer}>
            {GOALS.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[ styles.optionCard, isSelected && styles.selectedCard ]}
                  onPress={() => setSelectedId(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardContent}>
                      <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      
                      <View style={{flex: 1}}>
                          <Text style={[styles.optionText, isSelected && styles.selectedText]}>
                            {item.label}
                          </Text>
                          <Text style={styles.optionDesc}>{item.desc}</Text>
                      </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.nextButton, !selectedId && styles.disabledButton]} 
            onPress={handleNext}
            disabled={!selectedId}
          >
            <Text style={[styles.btnText, !selectedId && {color: '#999'}]}>Tiếp theo</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingVertical: 10, marginBottom: 10 
  },
  
  scrollContent: { paddingBottom: 20 },

  title: { 
    fontSize: 24, fontWeight: 'bold', color: '#333', 
    marginTop: 10, marginBottom: 10, lineHeight: 34 
  },
  subtitle: { 
    fontSize: 15, color: '#666', marginBottom: 30, lineHeight: 22 
  },
  
  optionsContainer: { gap: 15 },
  optionCard: {
    paddingVertical: 15, paddingHorizontal: 20,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#EEE',
    backgroundColor: '#fff',
  },
  selectedCard: { backgroundColor: '#FFFDE7', borderColor: '#FDD835' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },

  radioCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#FDD835', marginRight: 15,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  selectedRadio: { borderColor: '#FDD835', backgroundColor: '#fff' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FDD835' },
  
  optionText: { fontSize: 16, color: '#333', fontWeight: 'bold', marginBottom: 4 },
  selectedText: { color: '#F9A825' },
  optionDesc: { fontSize: 13, color: '#888' },

  footer: { paddingVertical: 20, backgroundColor: '#fff' },
  nextButton: {
    backgroundColor: '#FDD835', paddingVertical: 16,
    borderRadius: 30, alignItems: 'center', width: '100%',
  },
  disabledButton: { backgroundColor: '#EEE' },
  btnText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});