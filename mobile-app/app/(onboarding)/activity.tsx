//app/(onboarding)/activity.tsx
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';

const ACTIVITIES = [
  { id: 'sedentary', label: 'Ít vận động', desc: 'Hầu như không tập thể dục, công việc ngồi nhiều' },
  { id: 'light', label: 'Vận động nhẹ nhàng', desc: 'Tập thể dục nhẹ 1 - 3 buổi/tuần, hoặc đi bộ vừa phải' },
  { id: 'moderate', label: 'Vận động trung bình', desc: 'Tập thể dục 3 - 5 buổi/tuần, hoặc công việc vận động nhiều' },
  { id: 'heavy', label: 'Năng vận động', desc: 'Tập thể dục cường độ cao 5 - 7 ngày/tuần' },
];

export default function ActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { charId } = params;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lấy tên nhân vật để hiện ở Subtitle
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
    setLoading(true);

    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          activityLevel: selectedId,
          isOnboardingCompleted: true 
        });
      }
    router.push({ 
      pathname: '/(onboarding)/target-weight', 
      params: { ...params, activityLevel: selectedId } 
    } as any);

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
        
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: '71%' }]} /></View>
        <Text style={styles.stepText}>5/7</Text>
      </View>

      {/* 2. Tiêu đề & Subtitle */}
      <Text style={styles.title}>Thói quen vận động của bạn ở mức độ nào?</Text>
      
      <Text style={styles.subtitle}>
        <Text style={{fontWeight: 'bold', color: '#F9A825'}}>{getCharacterName()}</Text> sẽ đưa ra khuyến nghị chính xác nhất dựa trên mức vận động thực tế
      </Text>

      {/* 3. Danh sách lựa chọn */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {ACTIVITIES.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.card, 
                isSelected && styles.selectedCard 
              ]}
              onPress={() => setSelectedId(item.id)}
              activeOpacity={0.9}
            >
              <View style={styles.cardContent}>
                
                {/* Radio Button */}
                <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                
                {/* Text Content */}
                <View style={styles.textWrapper}>
                  <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>
                    {item.label}
                  </Text>
                  <Text style={styles.cardDesc}>
                    {item.desc}
                  </Text>
                </View>

              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 4. Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, !selectedId && styles.disabledButton]} 
          onPress={handleNext}
          disabled={!selectedId || loading}
        >
          {loading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <Text style={[styles.btnText, !selectedId && {color: '#999'}]}>Tiếp theo</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#FFF9C4', borderRadius: 3, marginHorizontal: 15 },
  progressFill: { height: '100%', backgroundColor: '#FDD835', borderRadius: 3 },
  stepText: { color: '#999', fontWeight: 'bold' },
  
  // Title
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 20, lineHeight: 22 },
  
  // List
  listContainer: { paddingBottom: 20 },
  card: { 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: '#EEE', 
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 15
  },
  selectedCard: { 
    backgroundColor: '#FFFDE7',
    borderColor: '#FDD835'      
  },
  
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  
  // Radio Button Styles
  radioCircle: { 
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, 
    borderColor: '#FDD835', 
    marginRight: 15, marginTop: 2, 
    justifyContent: 'center', alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  selectedRadio: { 
    backgroundColor: '#fff', 
    borderColor: '#FDD835' 
  },
  radioDot: { 
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#FDD835' 
  },

  // Text Styles
  textWrapper: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  selectedText: { color: '#F9A825' },
  cardDesc: { fontSize: 13, color: '#888', lineHeight: 18 },

  // Footer
  footer: { paddingBottom: 30, paddingTop: 10 },
  nextButton: { backgroundColor: '#FDD835', padding: 16, borderRadius: 30, alignItems: 'center' },
  disabledButton: { backgroundColor: '#E0E0E0' },
  btnText: { fontWeight: 'bold', fontSize: 18, color: '#333' }
});