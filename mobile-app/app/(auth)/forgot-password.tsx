//app/(auth)/forgot-password.tsx
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, 
  Dimensions, StatusBar, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { resetPassword } from '@/src/api/authApi';
import { SafeAreaView } from 'react-native-safe-area-context';

// 1. LẤY KÍCH THƯỚC MÀN HÌNH
const { width, height } = Dimensions.get('window');

const LOGO_WIDTH = width * 0.35;
const LOGO_HEIGHT = LOGO_WIDTH * 0.7; 
const INPUT_HEIGHT = height > 700 ? 55 : 45; 

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (result.error.includes("auth/user-not-found")) {
        Alert.alert("Lỗi", "Email này chưa được đăng ký tài khoản nào!");
      } else if (result.error.includes("auth/invalid-email")) {
        Alert.alert("Lỗi", "Định dạng email không hợp lệ!");
      } else {
        Alert.alert("Lỗi", result.error);
      }
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
          <View style={styles.container}>

            <View style={styles.headerSection}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="#333" />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <Image 
                  source={require('@/assets/images/auth_logo.jpg')} 
                  style={styles.logo} 
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.formContainer}>
              
              <Text style={styles.instructionText}>
                Nhập email để nhận link đặt lại mật khẩu.
              </Text>

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
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05, 
  },

  headerSection: {
    alignItems: 'center',
    marginTop: height * 0.02,
    marginBottom: height * 0.04,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 5,
    marginBottom: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },

  formContainer: {
    width: '100%',
  },
  instructionText: {
    fontSize: 16,
    color: '#666', 
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20, 
    lineHeight: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: INPUT_HEIGHT,
    backgroundColor: '#F3F0E3',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    color: '#333',
    marginBottom: 40,
  },
  sendButton: {
    backgroundColor: '#FDD835',
    borderRadius: 12,
    height: INPUT_HEIGHT + 5,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: "#FDD835", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
      android: { elevation: 4 }
    })
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});