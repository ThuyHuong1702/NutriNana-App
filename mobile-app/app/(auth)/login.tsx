//app/(auth)/login.tsx
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/src/config/firebase'; 
import { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Image, KeyboardAvoidingView, Platform, ScrollView, 
  Dimensions, StatusBar, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '@/src/api/authApi';
import { makeRedirectUri } from 'expo-auth-session';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

// 1. LẤY KÍCH THƯỚC MÀN HÌNH
const { width, height } = Dimensions.get('window');

// Tính toán kích thước tương đối
const LOGO_WIDTH = width * 0.4; 
const LOGO_HEIGHT = LOGO_WIDTH * 0.7;
const INPUT_HEIGHT = height > 700 ? 55 : 45; 

export default function LoginScreen() {
  const router = useRouter();
  
  // Hardcode redirectUri 
  const redirectUri = 'https://auth.expo.io/@thuyhuong/nutrinana'; 

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Cấu hình Google
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '756875053212-m5fp0ld9dc0pa399a88salfokde83fjf.apps.googleusercontent.com',
    redirectUri: redirectUri, 
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log("Google Sign-In Success:", userCredential.user.email);
          router.replace('/(onboarding)/character'); 
        })
        .catch((error) => {
          console.log("Google Sign-In Error:", error);
          Alert.alert("Lỗi", "Đăng nhập Google thất bại: " + error.message);
        });
    }
  }, [response]);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success) {
      router.replace('/(onboarding)/character');
    } else {
      Alert.alert("Lỗi đăng nhập", "Sai email hoặc mật khẩu!");
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
            
            {/* Header: Nút Back & Logo */}
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

            {/* Form */}
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
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={22} 
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
              <TouchableOpacity 
                style={styles.forgotPassword} 
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.textGray}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>HOẶC</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity 
                style={styles.googleButton} 
                disabled={!request}
                onPress={() => {
                  promptAsync(); 
                }} 
              >
                <Ionicons name="logo-google" size={20} color="#333" style={{marginRight: 10}} />
                <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
              </TouchableOpacity>

              {/* Footer */}
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
    marginBottom: height * 0.03,
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
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
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0E3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: INPUT_HEIGHT,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },

  loginButton: {
    backgroundColor: '#FDD835',
    borderRadius: 12,
    height: INPUT_HEIGHT + 5, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    ...Platform.select({
      ios: { shadowColor: "#FDD835", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
      android: { elevation: 4 }
    })
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
    padding: 5,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 12,
    fontWeight: 'bold',
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: '#CCC',
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
    marginTop: 30,
    marginBottom: 20,
  },
  textGray: {
    color: '#666',
    fontSize: 15,
  },
  linkText: {
    color: '#F9A825',
    fontWeight: 'bold',
    fontSize: 15,
  },
});