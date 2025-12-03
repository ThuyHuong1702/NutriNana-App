import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Platform, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context'; // Dùng thư viện này chuẩn hơn SafeArea mặc định

// 1. CẤU HÌNH KÍCH THƯỚC LINH HOẠT (RESPONSIVE)
const { width, height } = Dimensions.get('window');
const ITEM_SIZE = width * 0.6; // Tăng lên 60% để nhìn rõ hơn
const SPACING = (width - ITEM_SIZE) / 2;

// Tính toán chiều cao vùng lướt dựa trên màn hình
const CAROUSEL_HEIGHT = height * 0.55; 

const CHARACTERS = [
  { id: 'max', name: 'Max', desc: 'Gymer chính hiệu', image: require('@/assets/images/banana-muscle.jpg') },
  { id: 'mimi', name: 'Mimi', desc: 'Nhẹ nhàng, tinh tế', image: require('@/assets/images/girl-character.jpg') },
  { id: 'chuck', name: 'Chef Chuck', desc: 'Đam mê nấu ăn', image: require('@/assets/images/chef-banana.jpg') },
  { id: 'ninja', name: 'Lady Na', desc: 'Nhanh như gió', image: require('@/assets/images/laydy-na.jpg') },
  { id: 'baby', name: 'Baby Na', desc: 'Dễ thương vô đối', image: require('@/assets/images/cool-na.jpg') },
];

export default function CharacterScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(CHARACTERS[0].id);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_SIZE);
    if (CHARACTERS[index]) {
      setSelectedId(CHARACTERS[index].id);
    }
  };

  const handleNext = () => {
    router.push({ pathname: '/(onboarding)/nickname', params: { charId: selectedId } } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Chọn bạn đồng hành</Text>
        <Text style={styles.subtitle}>Lướt để chọn nhân vật yêu thích</Text>
      </View>

      {/* CAROUSEL */}
      <View style={{ height: CAROUSEL_HEIGHT }}>
        <Animated.FlatList
          data={CHARACTERS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          bounces={false} // Tắt hiệu ứng nảy trên iOS để mượt hơn
          contentContainerStyle={{ 
            paddingHorizontal: SPACING,
            alignItems: 'center' // Căn giữa theo chiều dọc
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item, index }) => {
            
            const inputRange = [
              (index - 1) * ITEM_SIZE,
              index * ITEM_SIZE,
              (index + 1) * ITEM_SIZE,
            ];

            // 1. Scale: Giảm độ chênh lệch để không bị vỡ layout trên màn nhỏ
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1, 0.8], 
              extrapolate: 'clamp',
            });

            // 2. TranslateY: Tính toán khoảng cách đẩy xuống dựa trên chiều cao thực tế
            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [CAROUSEL_HEIGHT * 0.1, 0, CAROUSEL_HEIGHT * 0.1], // Đẩy xuống 10% chiều cao vùng chứa
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.6, 1, 0.6],
              extrapolate: 'clamp',
            });

            return (
              <View style={{ width: ITEM_SIZE, justifyContent: 'center', alignItems: 'center' }}>
                <Animated.View
                  style={[
                    styles.card,
                    {
                      transform: [{ scale }, { translateY }],
                      opacity,
                    },
                  ]}
                >
                  <Image source={item.image} style={styles.image} resizeMode="contain" />
                  <View style={styles.textContainer}>
                    <Text style={styles.charName}>{item.name}</Text>
                    <Text style={styles.charDesc}>{item.desc}</Text>
                  </View>
                </Animated.View>
              </View>
            );
          }}
        />
      </View>

      {/* FOOTER */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            Chọn {CHARACTERS.find(c => c.id === selectedId)?.name}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.07, // Font size theo chiều rộng màn hình (~28px trên iPhone X)
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: width * 0.04, // ~16px
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    width: '90%', // Chiếm 90% của ITEM_SIZE
    height: '85%', // Chiếm 85% chiều cao vùng chứa
    backgroundColor: '#FFF9C4',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'space-between', // Phân bố đều ảnh và chữ
    padding: 20,
    borderWidth: 2,
    borderColor: '#fff',
    
    // Shadow chuẩn cho cả 2 hệ điều hành
    ...Platform.select({
      ios: {
        shadowColor: "#FBC02D",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 10, // Elevation cao hơn để nổi rõ trên Android
      }
    })
  },
  image: {
    width: '100%',
    height: '70%', // Ảnh chiếm 60% chiều cao card
    marginTop: 10,
  },
  textContainer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  charName: {
    fontSize: width * 0.06, // Responsive font
    fontWeight: 'bold',
    color: '#333',
  },
  charDesc: {
    fontSize: width * 0.035,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  nextButton: {
    backgroundColor: '#FDD835',
    paddingVertical: height * 0.02, // Padding dọc theo chiều cao màn hình
    paddingHorizontal: width * 0.2, // Padding ngang rộng hơn
    borderRadius: 30,
    
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      }
    })
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});