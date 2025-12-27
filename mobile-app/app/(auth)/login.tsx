// app/(auth)/login.tsx
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { BACKEND_URL, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from '@/src/config/apiConfig';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

const LOGO_WIDTH = width * 0.6; 
const LOGO_HEIGHT = LOGO_WIDTH * 0.6;
const INPUT_HEIGHT = height > 700 ? 55 : 45; 

export default function LoginScreen() {
  const router = useRouter();

  // State dữ liệu
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State lỗi (Validation)
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI, 
  });

  const checkProfileAndNavigate = async (uid: string) => {
    try {
      console.log("Checking profile for:", uid);
      const response = await fetch(`${BACKEND_URL}/api/get-profile/${uid}`);
      const data = await response.json();

      if (data.success && data.data) {
        router.replace('/(tabs)'); 
      } else {
        router.replace('/(onboarding)/character');
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      Alert.alert("Lỗi kết nối", "Không thể kiểm tra hồ sơ. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);

      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          await checkProfileAndNavigate(userCredential.user.uid);
        })
        .catch((error) => {
          Alert.alert("Lỗi", "Đăng nhập Google thất bại: " + error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [response]);


  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {

    setEmailError('');
    setPasswordError('');
    let isValid = true;

    if (!email.trim()) {
      setEmailError('Vui lòng nhập email.');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Email không đúng định dạng (ví dụ: abc@gmail.com).');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự.');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    const result = await loginUser(email, password);

    if (result.success) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await checkProfileAndNavigate(currentUser.uid);
      } else {
        setLoading(false);
        router.replace('/(onboarding)/character');
      }
    } else {
      setLoading(false);

      Alert.alert("Đăng nhập thất bại", "Email hoặc mật khẩu không chính xác.");
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
            
            {/* Header */}
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
              
              {/* --- EMAIL --- */}
              <Text style={styles.label}>E-mail</Text>
              <TextInput 
                style={[
                  styles.input, 
                  emailError ? styles.inputError : null
                ]} 
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                autoCapitalize="none"
                placeholder="Nhập email của bạn..." 
                placeholderTextColor="#999"
                keyboardType="email-address"
              />

              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <Text style={styles.label}>Mật khẩu</Text>
              <View style={[
                styles.passwordContainer,
                passwordError ? styles.inputError : null 
              ]}>
                <TextInput 
                  style={styles.passwordInput} 
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(''); 
                  }}
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
   
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#333" />
                ) : (
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.forgotPassword} 
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.textGray}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>HOẶC</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.googleButton} 
                disabled={!request}
                onPress={() => { promptAsync(); }} 
              >
                <Ionicons name="logo-google" size={20} color="#333" style={{marginRight: 10}} />
                <Text style={styles.googleButtonText}>Tiếp tục với Google</Text>
              </TouchableOpacity>

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

  inputError: {
    borderColor: '#FF5252', 
    borderWidth: 1.5,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 5,
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