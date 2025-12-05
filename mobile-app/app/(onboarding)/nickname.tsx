import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, 
  KeyboardAvoidingView, Platform, ScrollView, Dimensions, StatusBar 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const AVATAR_SIZE = width * 0.45;
const INPUT_WIDTH = width * 0.85;

export default function NicknameScreen() {
  const router = useRouter();
  const { charId } = useLocalSearchParams();
  const [nickname, setNickname] = useState('');

  const getImage = () => {
    if (charId === 'max') return require('@/assets/images/banana-muscle.jpg');
    if (charId === 'chuck') return require('@/assets/images/chef-banana.jpg');
    if (charId === 'ninja') return require('@/assets/images/laydy-na.jpg');
    if (charId === 'baby') return require('@/assets/images/cool-na.jpg');
    return require('@/assets/images/girl-character.jpg'); 
  };

  const handleComplete = async () => {
    if (!nickname.trim()) {
      Alert.alert("Chưa nhập tên", "Hãy đặt cho mình một biệt danh thật ngầu nhé!");
      return;
    }
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          nickname: nickname,
          character: charId,
        });
      }
    router.push({
      pathname: '/(onboarding)/hello', // File mới chúng ta sắp tạo
      params: { charId, nickname }      // Truyền cả tên và nhân vật sang
    } as any);
    } catch (error) {
      console.log(error);
      Alert.alert("Lỗi", "Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.avatarContainer}>
              <Image source={getImage()} style={styles.avatar} resizeMode="contain" />
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.messageText}>Rất vui được gặp bạn.</Text>
              {/* Cho phép chữ to lên tối đa 1.5 lần thôi để không vỡ khung */}
              <Text style={[styles.messageText, {fontWeight: 'bold'}]} maxFontSizeMultiplier={1.5}>
                Biệt danh của bạn là gì?
              </Text>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Super hero" 
              placeholderTextColor="#999"
              value={nickname}
              onChangeText={setNickname}
              autoCorrect={false}
              // 👇 QUAN TRỌNG: Cho phép font to nhưng không phá vỡ input
              maxFontSizeMultiplier={1.2} 
            />

            <TouchableOpacity style={styles.nextButton} onPress={handleComplete}>
              <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>Tiếp theo</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40, // Tăng khoảng trống đáy để khi chữ to không bị sát lề
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
    justifyContent: 'center',
  },
  backBtn: {
    padding: 5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: height * 0.02, // Giảm khoảng cách cứng
    width: '100%',
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FDD835', 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 20, // Dùng số cố định thay vì % để ổn định hơn khi zoom
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 10 }
    })
  },
  avatar: {
    width: '75%',
    height: '75%',
    borderRadius: (AVATAR_SIZE * 0.75) / 2,
  },
  messageBox: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#CCC', 
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  messageText: {
    fontSize: 16, // Đặt font cơ bản
    color: '#333',
    textAlign: 'center',
    lineHeight: 24, 
  },
  input: {
    width: INPUT_WIDTH,
    // 👇 SỬA ĐỔI QUAN TRỌNG:
    minHeight: 60, // Dùng minHeight thay vì height
    paddingVertical: 10, // Thêm padding để chữ to không chạm viền trên/dưới
    
    borderWidth: 1.5,
    borderColor: '#FDD835',
    borderRadius: 15,
    
    textAlign: 'center',
    textAlignVertical: 'center', 
    includeFontPadding: false, // Giữ dòng này cho Android
    
    fontSize: 20, 
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 30,
  },
  nextButton: {
    width: width * 0.6,
    backgroundColor: '#FDD835',
    
    // 👇 SỬA ĐỔI: Dùng padding để nút tự to ra theo chữ
    paddingVertical: 16, 
    minHeight: 55,
    
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: "#FDD835", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
      android: { elevation: 5 }
    })
  },
  nextButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  }
});