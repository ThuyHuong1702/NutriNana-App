//app/(auth)/login.tsx
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/src/config/firebase'; // Import auth từ file config của bạn
import { useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { loginUser } from '@/src/api/authApi';
import { Alert, ActivityIndicator } from 'react-native';
// 👇 Import mới
import { makeRedirectUri } from 'expo-auth-session';//
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const redirectUri = 'https://auth.expo.io/@thuyhuong/nutrinana';
  //console.log("👉 ĐỊA CHỈ ĐANG DÙNG:", redirectUri);//
  // 1. State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // 1. CẤU HÌNH GOOGLE AUTH
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    // Thay cái mã Client ID bạn vừa copy ở Bước 1 vào đây:
    clientId: '756875053212-m5fp0ld9dc0pa399a88salfokde83fjf.apps.googleusercontent.com',
    redirectUri: redirectUri,//
    // Nếu chạy trên Android thật (file .apk) thì cần thêm androidClientId (tạm thời bỏ qua nếu chạy Expo Go)
  });

  // 2. LẮNG NGHE KẾT QUẢ ĐĂNG NHẬP
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      
      // Có token rồi, giờ dùng nó để đăng nhập vào Firebase
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          // Đăng nhập thành công!
          console.log("Google Sign-In Success:", userCredential.user.email);
          router.replace('/(tabs)'); // Chuyển vào trang chủ
        })
        .catch((error) => {
          console.log("Google Sign-In Error:", error);
          alert("Lỗi đăng nhập Google: " + error.message);
        });
    }
  }, [response]);
  // 2. Hàm xử lý Đăng Nhập
  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success) {
      // Đăng nhập thành công -> Vào thẳng App chính
      router.replace('/(tabs)'); 
    } else {
      Alert.alert("Lỗi đăng nhập", "Sai email hoặc mật khẩu!");
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
             {/* Nhớ thay ảnh logo thật của bạn vào đây */}
            <Image 
              source={require('@/assets/images/auth_logo.jpg')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>

          {/* 3. Form Đăng Nhập */}
          <View style={styles.formContainer}>
            
            {/* Email */}
            <Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input} 
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholder="Nhập email của bạn..." 
              placeholderTextColor="#999"
              keyboardType="email-address"
            />

            {/* Mật khẩu */}
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput} 
                value={password}
                onChangeText={setPassword}
                placeholder="Nhập mật khẩu..." 
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {/* Nút Đăng Nhập */}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#333" />
                ) : (
                    <Text style={styles.loginButtonText}>Đăng nhập</Text>
                )}
            </TouchableOpacity>

            {/* Quên mật khẩu */}
            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.textGray}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Hoặc tiếp tục với Google */}
            <TouchableOpacity 
                style={styles.googleButton} 
                disabled={!request}
                onPress={() => {
                            promptAsync(); // Gọi hàm này để bật cửa sổ đăng nhập Google
                        }} 
            >
              <Ionicons name="logo-google" size={20} color="#333" style={{marginRight: 10}} />
              <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
            </TouchableOpacity>

            {/* Footer chuyển sang đăng ký */}
            <View style={styles.footer}>
              <Text style={styles.textGray}>Bạn chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.linkText}>Đăng ký</Text>
              </TouchableOpacity>
            </View>

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
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 100,
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
    backgroundColor: '#F3F0E3', // Màu be nhạt
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0E3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#FDD835', // Màu vàng chủ đạo
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
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#fff',
  },
  googleButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  textGray: {
    color: '#666',
  },
  linkText: {
    color: '#333',
    fontWeight: 'bold',
  },
});