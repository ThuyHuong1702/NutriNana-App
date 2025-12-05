import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated, Platform, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// 1. CẤU HÌNH KÍCH THƯỚC
const { width, height } = Dimensions.get('window');
const ITEM_SIZE = width * 0.6;
const SPACING = (width - ITEM_SIZE) / 2;
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

  // Mặc định chọn Chuck
  const DEFAULT_INDEX = 2; 
  const [selectedId, setSelectedId] = useState(CHARACTERS[DEFAULT_INDEX].id);
  const scrollX = useRef(new Animated.Value(DEFAULT_INDEX * ITEM_SIZE)).current;

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_SIZE);
    if (index >= 0 && index < CHARACTERS.length) {
      setSelectedId(CHARACTERS[index].id);
    }
  };

  const handleNext = () => {
    router.push({ pathname: '/(onboarding)/nickname', params: { charId: selectedId } } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        {/* 👇 Cho phép tiêu đề to lên tối đa 1.5 lần */}
        <Text style={styles.title} maxFontSizeMultiplier={1.5}>Chọn bạn đồng hành</Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>Lướt để chọn nhân vật yêu thích</Text>
      </View>

      <View style={{ height: CAROUSEL_HEIGHT }}>
        <Animated.FlatList
          data={CHARACTERS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_SIZE}
          decelerationRate="fast"
          bounces={false}
          initialScrollIndex={DEFAULT_INDEX} 
          getItemLayout={(data, index) => ({
            length: ITEM_SIZE, offset: ITEM_SIZE * index, index,
          })}
          contentContainerStyle={{ paddingHorizontal: SPACING, alignItems: 'center' }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item, index }) => {
            
            const inputRange = [(index - 1) * ITEM_SIZE, index * ITEM_SIZE, (index + 1) * ITEM_SIZE];
            const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
            const translateY = scrollX.interpolate({ inputRange, outputRange: [CAROUSEL_HEIGHT * 0.1, 0, CAROUSEL_HEIGHT * 0.1], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: 'clamp' });

            return (
              <View style={{ width: ITEM_SIZE, justifyContent: 'center', alignItems: 'center' }}>
                <Animated.View style={[ styles.card, { transform: [{ scale }, { translateY }], opacity } ]}>
                  
                  <Image source={item.image} style={styles.image} resizeMode="contain" />
                  
                  <View style={styles.textContainer}>
                    {/* 👇 Giới hạn chữ trong Card tối đa 1.2 lần để không vỡ Card */}
                    <Text style={styles.charName} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                      {item.name}
                    </Text>
                    
                    {/* 👇 Giới hạn mô tả, nếu dài quá thì hiện dấu ... */}
                    <Text style={styles.charDesc} maxFontSizeMultiplier={1.1} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>

                </Animated.View>
              </View>
            );
          }}
        />
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          {/* 👇 Giới hạn chữ trong nút bấm */}
          <Text style={styles.nextButtonText} maxFontSizeMultiplier={1.2}>
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
    paddingHorizontal: 20, // Thêm padding ngang để chữ to không sát lề
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: width * 0.04,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    width: '90%', 
    height: '85%', 
    backgroundColor: '#FFF9C4',
    borderRadius: 30,
    alignItems: 'center',
    // justifyContent: 'space-between', // BỎ dòng này đi
    padding: 15, // Giảm padding một chút để tiết kiệm diện tích
    borderWidth: 2,
    borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: "#FBC02D", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10 },
      android: { elevation: 10 }
    })
  },
  image: {
    width: '100%',
    flex: 1, // 👇 Thay đổi quan trọng: Để ảnh tự co giãn chiếm chỗ trống còn lại
    marginBottom: 10,
  },
  textContainer: {
    alignItems: 'center',
    paddingBottom: 10,
    height: '25%', // 👇 Dành riêng 25% chiều cao card cho chữ
    justifyContent: 'center',
  },
  charName: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  charDesc: {
    fontSize: width * 0.035,
    color: '#666',
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
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.15, // Giảm padding ngang một chút
    borderRadius: 30,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 },
      android: { elevation: 6 }
    })
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});