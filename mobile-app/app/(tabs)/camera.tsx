// File: app/camera.tsx
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, useWindowDimensions, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Tabs } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function NanaIntroScreen() {
  const router = useRouter();
  
  // 1. STATE QUẢN LÝ LOADING
  const [isLoading, setIsLoading] = useState(false);

  // 2. LẤY KÍCH THƯỚC MÀN HÌNH & TÍNH TOÁN VIDEO
  const { width, height } = useWindowDimensions();
  const videoSize = Math.min(width - 40, 400, height * 0.45);

  const isLocal = true; 
  const videoSource = isLocal 
    ? require('../../assets/videos/ai_video.mp4') 
    : 'https://cdn.pixabay.com/video/2024/02/09/199958-911693751_large.mp4';

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
    player.muted = true;
  });

  const handleBack = () => router.back();

  const handleSkip = () => {
    player.pause();
    router.push('/chat');
  };

  const handleSnap = async () => {
    player.pause();
    Alert.alert(
      "Chọn ảnh nguyên liệu",
      "Bạn muốn chụp ảnh mới hay chọn từ thư viện?",
      [
        { text: "Hủy", style: "cancel", onPress: () => player.play() },
        { text: "Thư viện", onPress: pickImageFromLibrary },
        { text: "Chụp ảnh", onPress: pickImageFromCamera }
      ]
    );
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Cần cấp quyền truy cập Camera!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    handleImageResult(result);
  };

  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    handleImageResult(result);
  };

  // 3. HÀM GỬI ẢNH LÊN SERVER PYTHON
  const uploadImageToAPI = async (imageUri: string) => {
    setIsLoading(true); // Bật loading

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      // --- KHAI BÁO IP 
      const BACKEND_URL = 'http://192.168.1.3:8000'; 
      const API_URL = `${BACKEND_URL}/api/detect`; 

      console.log("Đang gửi ảnh tới:", API_URL);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Kết quả AI trả về:", data);

      setIsLoading(false); // Tắt loading

      // 4. CHUYỂN SANG MÀN HÌNH INGREDIENTS
      router.push({
        pathname: '/ingredients', 
        params: { 
          imageUri: imageUri,
          ingredients: JSON.stringify(data.ingredients) 
        }
      });

    } catch (error) {
      setIsLoading(false);
      console.error("Lỗi upload:", error);
      Alert.alert(
        "Lỗi kết nối", 
        "Không thể gọi AI Server. Hãy kiểm tra:\n1. IP máy tính có đúng là 192.168.1.3 không?\n2. Server Python đã chạy lệnh '... --host 0.0.0.0' chưa?\n3. Điện thoại và máy tính có chung Wifi không?"
      );
      player.play(); 
    }
  };

  const handleImageResult = (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled) {
      uploadImageToAPI(result.assets[0].uri);
    } else {
      player.play();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' }, headerShown: false }} />

      {/* GIAO DIỆN LOADING */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FDD835" />
          <Text style={styles.loadingText}>Đang nhận diện món ăn...</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333333" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { minHeight: height - 100 } 
        ]} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.innerContent}>
          <View style={[
            styles.videoWrapper, 
            { width: videoSize, height: videoSize }
          ]}>
            <VideoView style={styles.video} player={player} nativeControls={false} contentFit="cover" />
          </View>

          <Text 
            style={styles.descriptionText} 
            maxFontSizeMultiplier={1.3}
          >
            Chụp ảnh nguyên liệu bạn có,{'\n'}
            NutriNana sẽ gợi ý món ăn ngon, lành{'\n'}
            mạnh và giàu dinh dưỡng cho bạn
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleSkip}>
              <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>Bỏ qua</Text>
            </TouchableOpacity>
            
            <View style={{width: 15}} /> 
            
            <TouchableOpacity style={styles.button} onPress={handleSnap}>
              <Text style={styles.buttonText} numberOfLines={1} adjustsFontSizeToFit>Chụp ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    alignItems: 'flex-start', 
    zIndex: 10,
  },
  backButton: { padding: 5 },
  
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center',
    paddingBottom: 30, 
  },
  innerContent: { 
    alignItems: 'center', 
    width: '100%', 
    paddingHorizontal: 20 
  },
  
  videoWrapper: {
    backgroundColor: '#FFFFFF', 
    marginBottom: 30,
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden', 
  },
  video: { width: '100%', height: '100%', backgroundColor: '#FFFFFF' },
  
  descriptionText: {
    textAlign: 'center', 
    fontSize: 15, 
    color: '#333333',
    lineHeight: 24, 
    marginBottom: 30, 
    fontWeight: '400', 
    maxWidth: 500,
  },
  
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    width: '100%', 
    maxWidth: 500 
  },
  button: {
    backgroundColor: '#FDD835', 
    paddingVertical: 14, 
    borderRadius: 25,
    flex: 1, 
    alignItems: 'center', 
    maxWidth: 200,
    paddingHorizontal: 5,
  },
  buttonText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333333',
  },
  
  // Style cho màn hình Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, 
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600'
  }
});