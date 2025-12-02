//app/(auth)/welcome.tsx
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function WelcomeScreen() {
  const router = useRouter();

  // Tự động chuyển trang sau 3 giây (hoặc bỏ đi nếu muốn bấm mới chuyển)
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/(auth)/landing');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1} 
      onPress={() => router.push('/(auth)/landing')}
    >
      {/* Thay ảnh con chuối của bạn vào đây */}
      <Image 
        source={require('@/assets/images/banana_mascot.jpg')} // Tạm dùng logo React, bạn nhớ đổi thành 'banana-mascot.png'
        style={styles.image} 
        resizeMode="contain"
      />
    </TouchableOpacity>
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