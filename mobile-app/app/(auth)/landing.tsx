// app/(auth)/landing.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ScrollView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const SLIDE_WIDTH = width * 0.9; 
const SLIDE_HEIGHT = height * 0.45;

const SLIDES = [
  require('@/assets/images/slides1.jpg'),
  require('@/assets/images/slides2.jpg'), 
  require('@/assets/images/slides3.jpg'),
];

export default function LandingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.topSection}>
          <Text style={styles.appName} allowFontScaling={true}>
            <Text style={{ color: '#4CAF50' }}>Nutri</Text>
            <Text style={{ color: '#FDD835' }}>Nana</Text>
          </Text>
          <Text style={styles.tagline} allowFontScaling={true}>Bạn đồng hành cho từng bữa ăn.</Text>

          <View style={styles.imagePlaceholder}>
            <Image 
              source={SLIDES[currentSlide]} 
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View style={styles.dotsContainer}>
            {SLIDES.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.dot, 
                  currentSlide === index && styles.activeDot 
                ]} 
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/(auth)/signup')} 
          >
            <Text style={styles.buttonText}>Đăng ký miễn phí</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.textGray}>Bạn đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
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
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },

  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  appName: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: width * 0.045,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },

  imagePlaceholder: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden', 
    backgroundColor: '#F0F0F0', 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  dotsContainer: {
    flexDirection: 'row',
    height: 10,
    marginBottom: 20, 
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FDD835', 
    width: 20, 
  },

  bottomSection: {
    width: '100%',
    paddingBottom: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FDD835',
    width: '100%',
    maxWidth: 400,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  textGray: {
    color: '#888',
    fontSize: 16,
  },
  linkText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});