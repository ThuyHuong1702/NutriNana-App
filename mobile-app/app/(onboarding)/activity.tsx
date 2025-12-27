// app/(onboarding)/activity.tsx
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
  // Lấy goal và weight từ params để xử lý logic
  const { charId, goal, weight } = params;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // --- LOGIC PHÂN LUỒNG QUAN TRỌNG ---
      if (goal === 'maintain') {
        // [TRƯỜNG HỢP MAINTAIN]:
        // 1. Nhảy cóc qua TargetWeight
        // 2. Chuyển thẳng đến Plan
        // 3. Gán targetWeight = cân nặng hiện tại (weight)
        // 4. Gán weightSpeed = 0
        router.push({ 
          pathname: '/(onboarding)/plan', 
          params: { 
            ...params, 
            activityLevel: selectedId,
            targetWeight: weight, // Target = Current
            weightSpeed: 0 
          } 
        } as any);
      } else {
        // [TRƯỜNG HỢP GAIN / LOSE]:
        // Đi tiếp đến màn chọn Cân nặng mục tiêu
        router.push({ 
          pathname: '/(onboarding)/target-weight', 
          params: { 
            ...params, 
            activityLevel: selectedId 
          } 
        } as any);
      }

    } catch (error) {
      console.log(error);
      Alert.alert("Lỗi", "Không thể lưu dữ liệu.");
    } finally {
      setLoading(false);
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
          <Text style={styles.title}>Thói quen vận động của bạn ở mức độ nào?</Text>
          
          <Text style={styles.subtitle}>
            <Text style={{fontWeight: 'bold', color: '#F9A825'}}>{getCharacterName()}</Text> sẽ đưa ra khuyến nghị chính xác nhất dựa trên mức vận động thực tế
          </Text>

          <View style={styles.listContainer}>
            {ACTIVITIES.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[ styles.card, isSelected && styles.selectedCard ]}
                  onPress={() => setSelectedId(item.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardContent}>
                    <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.textWrapper}>
                      <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>
                        {item.label}
                      </Text>
                      <Text style={styles.cardDesc}>{item.desc}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

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

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 10 },
  backBtn: { padding: 5 },
  scrollContent: { paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 10, marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 20, lineHeight: 22 },
  listContainer: {},
  card: { borderRadius: 12, borderWidth: 1.5, borderColor: '#EEE', marginBottom: 15, backgroundColor: '#fff', padding: 15 },
  selectedCard: { backgroundColor: '#FFFDE7', borderColor: '#FDD835' },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#FDD835', marginRight: 15, marginTop: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  selectedRadio: { backgroundColor: '#fff', borderColor: '#FDD835' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FDD835' },
  textWrapper: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  selectedText: { color: '#F9A825' },
  cardDesc: { fontSize: 13, color: '#888', lineHeight: 18 },
  footer: { paddingVertical: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  nextButton: { backgroundColor: '#FDD835', padding: 16, borderRadius: 30, alignItems: 'center' },
  disabledButton: { backgroundColor: '#E0E0E0' },
  btnText: { fontWeight: 'bold', fontSize: 18, color: '#333' }
});