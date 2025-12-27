// app/(auth)/signup.tsx
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { registerUser } from '@/src/api/authApi';

const { width } = Dimensions.get('window');
const LOGO_WIDTH = width * 0.6;      
const LOGO_HEIGHT = LOGO_WIDTH * 0.6; 

export default function SignupScreen() {
  const router = useRouter();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getEmailBorderColor = () => {
    if (email.length === 0) return '#E0E0E0';
    if (!isValidEmail(email)) return '#FF5252';
    return '#4CAF50';
  };

  const getPasswordBorderColor = () => {
    if (password.length === 0) return '#E0E0E0';
    if (password.length < 6) return '#FF5252';
    return '#4CAF50';
  };

  const getConfirmPasswordBorderColor = () => {
    if (confirmPassword.length === 0) return '#E0E0E0';
    if (password !== confirmPassword) return '#FF5252';
    return '#4CAF50';
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Lỗi định dạng", "Email không hợp lệ!");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi mật khẩu", "Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    const result = await registerUser(email, password);
    setLoading(false);

    if (result.success) {
      Alert.alert("Thành công", "Tài khoản đã được tạo! Mời bạn đăng nhập.", [
        { text: "OK", onPress: () => router.replace('/(auth)/login') }
      ]);
    } else {
      let errorMessage = "Đăng ký thất bại.";
      if (result.error.includes("email-already-in-use")) {
        errorMessage = "Email này đã được sử dụng.";
      } else if (result.error.includes("invalid-email")) {
        errorMessage = "Email không hợp lệ.";
      }
      Alert.alert("Lỗi đăng ký", errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            
            {/* Header: Nút Back */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Logo Responsive */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/auth_logo.jpg')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              
              {/* --- EMAIL --- */}
              <Text style={styles.label}>E-mail</Text>
              <TextInput 
                style={[
                  styles.input, 
                  { borderColor: getEmailBorderColor() }
                ]} 
                placeholder="Nhập email..."
                value={email}
                onChangeText={setEmail} 
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#999"
              />
              {email.length > 0 && !isValidEmail(email) && (
                <Text style={styles.errorText}>
                  Email chưa hợp lệ. Ví dụ: abc@gmail.com
                </Text>
              )}

              {/* --- MẬT KHẨU --- */}
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={[
                styles.passwordContainer, 
                { borderColor: getPasswordBorderColor() } 
              ]}>
                <TextInput 
                  style={styles.passwordInput} 
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ít nhất 6 ký tự..." 
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword} 
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              {password.length > 0 && password.length < 6 && (
                 <Text style={styles.errorText}>
                   Mật khẩu quá ngắn (cần 6 ký tự trở lên)
                 </Text>
              )}

              {/* --- NHẬP LẠI MẬT KHẨU --- */}
              <Text style={styles.label}>Nhập lại mật khẩu</Text>
              <View style={[
                styles.passwordContainer,
                { borderColor: getConfirmPasswordBorderColor() }
              ]}>
                <TextInput 
                  style={styles.passwordInput} 
                  placeholder="********" 
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye" : "eye-off"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>

              {/* --- BUTTONS --- */}
              <TouchableOpacity style={styles.registerButton} onPress={handleSignup} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#333" />
                  ) : (
                    <Text style={styles.registerButtonText}>Đăng ký</Text>
                  )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.textGray}>Bạn đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.linkText}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>

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
    paddingBottom: 30, 
  },
  container: {
    flex: 1,
    paddingHorizontal: 20, 
  },
  header: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 5, 
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_WIDTH,   
    height: LOGO_HEIGHT,
    resizeMode: 'contain', 
  },

  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#F3F0E3', 
    borderRadius: 12,
    paddingVertical: 12, 
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    minHeight: 50, 
    color: '#333', 
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0E3',
    borderRadius: 12,
    borderWidth: 1, 
    paddingHorizontal: 15,
    minHeight: 50, 
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    height: '100%', 
  },
  eyeIcon: {
    padding: 5, 
    marginLeft: 5,
  },

  registerButton: {
    backgroundColor: '#FDD835', 
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
    flexWrap: 'wrap', 
  },
  textGray: {
    color: '#666',
    fontSize: 15,
  },
  linkText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#FF5252', 
    fontSize: 13, 
    marginTop: 5,
    marginLeft: 5, 
    fontStyle: 'italic' 
  },
});