//app/(onboarding)/height.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { height: heightVal });
      }
      router.push({ 
        pathname: '/(onboarding)/weight', 
        params: { ...params, height: heightVal } 
    } as any);
    } catch (error) { console.log(error); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: '45%' }]} /></View>
        <Text style={styles.stepText}>3/7</Text>
      </View>

      <Text style={styles.title}>Chiều cao của bạn là bao nhiêu?</Text>

      <View style={styles.pickerContainer}>
        <NumberPicker 
          min={100} max={220} 
          initialValue={170} 
          unit="Cm" 
          onValueChange={setHeightVal} 
        />
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.btnText}>Tiếp theo</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#FFF9C4', borderRadius: 3, marginHorizontal: 15 },
  progressFill: { height: '100%', backgroundColor: '#FDD835', borderRadius: 3 },
  stepText: { color: '#999', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 40, marginBottom: 50, color: '#333' },
  pickerContainer: { flex: 1, justifyContent: 'center' },
  nextButton: { backgroundColor: '#FDD835', padding: 16, borderRadius: 30, alignItems: 'center', marginBottom: 30 },
  btnText: { fontWeight: 'bold', fontSize: 18, color: '#333' }
});