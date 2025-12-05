//app/(onboarding)/hello.tsx
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HelloScreen() {
  const router = useRouter();
  const { charId, nickname } = useLocalSearchParams();

  // Lấy thông tin nhân vật
  const getCharacter = () => {
    switch (charId) {
      case 'max': return { name: 'Max', image: require('@/assets/images/banana-muscle.jpg') };
      case 'chuck': return { name: 'Chef Chuck', image: require('@/assets/images/chef-banana.jpg') };
      case 'ninja': return { name: 'Lady Na', image: require('@/assets/images/laydy-na.jpg') };
      case 'baby': return { name: 'Baby Na', image: require('@/assets/images/cool-na.jpg') };
      default: return { name: 'Mimi', image: require('@/assets/images/girl-character.jpg') };
    }
  };

  const character = getCharacter();

  useEffect(() => {
    // ⏳ Đếm ngược 3 giây rồi chuyển sang màn hình GIỚI TÍNH
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(onboarding)/goal', 
        params: { charId, nickname }
      } as any);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Ảnh nhân vật */}
        <View style={styles.imageWrapper}>
          <Image source={character.image} style={styles.image} resizeMode="contain" />
        </View>

        {/* Lời chào kết hợp Tên nhân vật và Tên người dùng */}
        <Text style={styles.greeting}>
          Xin chào <Text style={styles.highlight}>{nickname}</Text>!
        </Text>
        
        <Text style={styles.subText}>
          Tớ là <Text style={styles.highlight}>{character.name}</Text>.{'\n'}
          Tớ sẽ đồng hành cùng bạn nhé!
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: '#FFF9C4', // Nền vàng nhạt
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 4,
    borderColor: '#FDD835', // Viền vàng đậm
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  image: {
    width: '70%',
    height: '70%',
  },
  greeting: {
    fontSize: 26,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  subText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 28,
  },
  highlight: {
    color: '#FDD835',
    fontWeight: 'bold',
    fontSize: 28,
  },
});