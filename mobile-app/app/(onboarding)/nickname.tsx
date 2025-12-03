//app/(onboarding)/nickname.tsx
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

// 1. LẤY KÍCH THƯỚC MÀN HÌNH
const { width, height } = Dimensions.get('window');

// Tính toán kích thước tương đối
const AVATAR_SIZE = width * 0.45; // Avatar chiếm 45% chiều rộng màn hình
const INPUT_WIDTH = width * 0.85; // Input chiếm 85% chiều rộng

export default function NicknameScreen() {
  const router = useRouter();
  const { charId } = useLocalSearchParams();
  const [nickname, setNickname] = useState('');

  const getImage = () => {
    if (charId === 'max') return require('@/assets/images/banana-muscle.jpg');
    if (charId === 'chuck') return require('@/assets/images/chef-banana.jpg');
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
        pathname: '/(onboarding)/info',
        params: { charId, nickname } 
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Chỉnh khoảng cách bàn phím
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Ảnh đại diện Responsive */}
            <View style={styles.avatarContainer}>
              <Image source={getImage()} style={styles.avatar} resizeMode="contain" />
            </View>

            {/* Khung lời thoại */}
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>Rất vui được gặp bạn.</Text>
              <Text style={[styles.messageText, {fontWeight: 'bold'}]}>Biệt danh của bạn là gì?</Text>
            </View>

            {/* Ô nhập liệu */}
            <TextInput 
              style={styles.input} 
              placeholder="Super hero" 
              placeholderTextColor="#999"
              value={nickname}
              onChangeText={setNickname}
              autoCorrect={false}
            />

            {/* Nút Tiếp theo */}
            <TouchableOpacity style={styles.nextButton} onPress={handleComplete}>
              <Text style={styles.nextButtonText}>Tiếp theo</Text>
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
    paddingBottom: 20, // Thêm khoảng trống dưới cùng để lướt thoải mái
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50, // Chiều cao cố định cho header
    justifyContent: 'center',
  },
  backBtn: {
    padding: 5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: height * 0.05, // Cách trên 5% chiều cao màn hình
    width: '100%',
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2, // Bo tròn chuẩn
    borderWidth: 4,
    borderColor: '#FDD835', 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: height * 0.04, // Margin động theo chiều cao màn hình
    
    // Shadow đa nền tảng
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      }
    })
  },
  avatar: {
    width: '75%', // Ảnh chiếm 75% container
    height: '75%',
    borderRadius: (AVATAR_SIZE * 0.75) / 2,
  },
  messageBox: {
    width: '80%', // Chiếm 80% chiều ngang để không bị tràn text
    borderWidth: 1,
    borderColor: '#CCC', 
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: height * 0.04,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  messageText: {
    fontSize: width * 0.045, // Cỡ chữ theo chiều rộng màn hình (~16-18px)
    color: '#333',
    textAlign: 'center',
    lineHeight: width * 0.07, 
  },
  input: {
    width: INPUT_WIDTH,
    height: 55,
    borderWidth: 1.5,
    borderColor: '#FDD835',
    borderRadius: 15,
    textAlign: 'center',
    fontSize: width * 0.05, // Chữ to rõ ràng
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: height * 0.05,
  },
  nextButton: {
    width: width * 0.6, // Nút rộng 60% màn hình
    backgroundColor: '#FDD835',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    
    // Shadow nút bấm
    ...Platform.select({
      ios: {
        shadowColor: "#FDD835",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      }
    })
  },
  nextButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
  }
});