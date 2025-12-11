import { useEffect, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Giữ màn hình chờ 1.5s
      await new Promise(resolve => setTimeout(resolve, 1500));

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            console.log("🔍 Đã tìm thấy User:", user.email);
            
            // Kiểm tra Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("📂 Dữ liệu User trong DB:", userData);

              // Kiểm tra cờ
              if (userData.isOnboardingCompleted === true) {
                console.log("✅ Đã xong Onboarding -> Vào Trang chủ");
                router.replace('/(tabs)');
              } else {
                console.log("⚠️ Chưa có cờ isOnboardingCompleted (hoặc false) -> Vào Onboarding");
                router.replace('/(onboarding)/character');
              }
            } else {
              console.log("❌ Không tìm thấy hồ sơ trong Firestore -> Vào Onboarding tạo mới");
              router.replace('/(onboarding)/character');
            }
          } else {
            console.log("👤 Chưa đăng nhập -> Vào Welcome");
            router.replace('/(auth)/welcome');
          }
        } catch (error) {
          console.error("Lỗi kiểm tra:", error);
          router.replace('/(auth)/welcome');
        } finally {
          setChecking(false);
        }
      });

      return unsubscribe;
    };

    checkUser();
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/banana_mascot.jpg')} 
        style={styles.image} 
        resizeMode="contain"
      />
      <ActivityIndicator style={{marginTop: 20}} color="#FDD835" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 300,
  },
});