import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';
import NumberPicker from '@/src/components/NumberPicker';

export default function TargetWeightScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const currentWeight = parseFloat(params.weight as string) || 60;
  const goal = params.goal as string; // 'gain' | 'lose'

  const [targetWeight, setTargetWeight] = useState(currentWeight);
  const [loading, setLoading] = useState(false);

  let minVal = 30;
  let maxVal = 200;
  let initVal = currentWeight;

  if (goal === 'gain') {
    minVal = currentWeight + 1;
    maxVal = 200;
    initVal = currentWeight + 2; 
  } else if (goal === 'lose') {
    minVal = 30;
    maxVal = currentWeight - 1;
    initVal = currentWeight - 2; 
  }

  useEffect(() => {
    setTargetWeight(initVal);
  }, []);

  const handleNext = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          targetWeight: targetWeight
        });
      }
      router.push({ 
        pathname: '/(onboarding)/speed', 
        params: { ...params, targetWeight: targetWeight } 
      } as any);

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '85%' }]} />
        </View>
        <Text style={styles.stepText}>6/7</Text>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {goal === 'gain' ? "Bạn muốn tăng lên bao nhiêu kg?" : "Bạn muốn giảm xuống bao nhiêu kg?"}
        </Text>

        <View style={styles.pickerContainer}>
          <NumberPicker 
            key={goal}
            min={minVal} 
            max={maxVal} 
            initialValue={initVal} 
            unit="Kg" 
            onValueChange={setTargetWeight} 
          />
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={handleNext} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#333" />
          ) : (
            <Text style={styles.btnText}>Tiếp theo</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 20 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#FFF9C4', borderRadius: 3, marginHorizontal: 15 },
  progressFill: { height: '100%', backgroundColor: '#FDD835', borderRadius: 3 },
  stepText: { color: '#999', fontWeight: 'bold' },
  
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#333' },
  
  pickerContainer: { height: 250, width: '100%', justifyContent: 'center', alignItems: 'center' },
  
  footer: { paddingVertical: 20 },
  nextButton: { backgroundColor: '#FDD835', padding: 16, borderRadius: 30, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 18, color: '#333' }
});