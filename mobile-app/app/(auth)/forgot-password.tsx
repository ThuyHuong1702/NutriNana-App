//app/(auth)/forgot-password.tsx
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { resetPassword } from '@/src/api/authApi';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý gửi mail
  const handleSendMail = async () => {
    if (!email) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "Đã gửi!", 
        "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } else {
      // 👇 Kiểm tra mã lỗi cụ thể để báo tin nhắn tiếng Việt dễ hiểu
      if (result.error.includes("auth/user-not-found")) {
        Alert.alert("Lỗi", "Email này chưa được đăng ký tài khoản nào!");
      } else if (result.error.includes("auth/invalid-email")) {
        Alert.alert("Lỗi", "Định dạng email không hợp lệ!");
      } else {
        Alert.alert("Lỗi", result.error); // Các lỗi khác
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          
          {/* 1. Nút Quay Lại */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          {/* 2. Logo NutriNana */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/auth_logo.jpg')} // Nhớ dùng đúng ảnh logo của bạn
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>

          {/* 3. Nội dung chính */}
          <View style={styles.formContainer}>
            
            <Text style={styles.instructionText}>
              Nhập email để nhận link đặt lại mật khẩu.
            </Text>

            {/* Ô nhập Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nhập email..." 
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Nút Gửi Mail */}
            <TouchableOpacity 
              style={styles.sendButton} 
              onPress={handleSendMail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#333" />
              ) : (
                <Text style={styles.sendButtonText}>Gửi mail</Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 150,
    height: 100,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F0E3', // Màu be nhạt giống thiết kế
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    marginBottom: 40,
  },
  sendButton: {
    backgroundColor: '#FDD835', // Màu vàng chủ đạo
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});