import { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/config/firebase';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lắng nghe trạng thái đăng nhập
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        // Thêm một chút độ trễ nhỏ (ví dụ 1.5s) để người dùng kịp nhìn thấy logo 
        // trước khi chuyển trang (tránh giật màn hình quá nhanh)
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (user) {
          // 1. Nếu ĐÃ ĐĂNG NHẬP -> Kiểm tra xem đã làm Onboarding chưa
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists() && userDoc.data().isOnboardingCompleted) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(onboarding)/character');
          }
        } else {
          // 2. Nếu CHƯA ĐĂNG NHẬP -> Ra cổng chào
          router.replace('/(auth)/welcome');
        }
      } catch (error) {
        console.log("Lỗi kiểm tra trạng thái:", error);
        router.replace('/(auth)/welcome');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Màn hình chờ: Giống hệt màn hình Welcome (Con chuối)
  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/banana_mascot.jpg')} 
        style={styles.image} 
        resizeMode="contain"
      />
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