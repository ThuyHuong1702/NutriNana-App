//app/(onboarding)/prepare.tsx
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PrepareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { charId } = params;

  // Hàm lấy thông tin nhân vật (Ảnh + Tên)
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

  const handleNext = () => {
    // Chuyển tiếp sang màn hình Giới tính
    router.push({ 
        pathname: '/(onboarding)/gender', 
        params: { ...params } 
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Khung ảnh vuông xám trong thiết kế -> Thay bằng ảnh nhân vật cho sinh động */}
        <View style={styles.imagePlaceholder}>
           <Image source={character.image} style={styles.image} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Tuyệt vời!</Text>

        {/* Lời dẫn 1 */}
        <Text style={styles.description}>
          <Text style={styles.highlight}>{character.name}</Text> tin rằng bạn đã sẵn sàng cho mục tiêu đó.
        </Text>

        {/* Lời dẫn 2 */}
        <Text style={styles.subDescription}>
          <Text style={styles.highlight}>{character.name}</Text> có 7 câu hỏi nhỏ để thiết lập kế hoạch đạt mục tiêu cho bạn. Cùng bắt đầu ngay nhé!
        </Text>

        {/* Nút Tiếp theo */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.btnText}>Tiếp theo</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#E0E0E0', // Màu xám như thiết kế
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden', // Để ảnh không tràn ra bo góc
  },
  image: {
    width: '80%',
    height: '80%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 15,
  },
  description: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 30,
  },
  subDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  highlight: {
    color: '#F9A825', // Màu vàng đậm tên nhân vật
    fontWeight: 'bold',
  },
  
  // Footer Button
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 30,
    width: '100%',
  },
  nextButton: {
    backgroundColor: '#FDD835',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
  },
  btnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});