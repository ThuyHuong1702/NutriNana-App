// File: app/chat.tsx
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, 
  Image, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 

// Định nghĩa kiểu tin nhắn
type Message = {
  id: string;
  text: string;
  sender: 'bot' | 'user';
};

export default function ChatScreen() {
  const router = useRouter();
  const { aiReply } = useLocalSearchParams(); 
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false); 

  const scrollViewRef = useRef<ScrollView>(null);

  const BACKEND_URL = 'http://192.168.1.3:8000'; 
  const botAvatar = 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'; 

  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: '1',
        sender: 'bot',
        text: 'Mimi đã xem kỹ các nguyên liệu bạn gửi rồi 🥗\nChờ một chút nhé, mình đang chọn ra những món ăn cân bằng dinh dưỡng nhất cho bạn!'
      }
    ];

    if (aiReply) {
      initialMessages.push({
        id: '2',
        sender: 'bot',
        text: aiReply as string
      });
    }
    setMessages(initialMessages);
  }, [aiReply]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // --- 1. HÀM CHAT (Gửi tin nhắn văn bản) ---
  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    
    const messageToSend = inputText;
    setInputText('');
    setIsSending(true);

    try {
      // Gọi API Chat (Lưu ý đường dẫn /api/chat)
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      });

      const data = await response.json();

      if (data.success) {
        const botMsg: Message = { id: (Date.now() + 1).toString(), text: data.reply, sender: 'bot' };
        setMessages(prev => [...prev, botMsg]);
      } 
    } catch (error) {
      console.error("Lỗi chat:", error);
      const errorMsg: Message = { id: Date.now().toString(), text: "⚠️ Mất kết nối tới Server.", sender: 'bot' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // --- 2. HÀM XỬ LÝ NÚT CAMERA (Góc phải Header) ---
  const handleCameraPress = () => {
    Alert.alert("Chọn ảnh", "Bạn muốn lấy ảnh từ đâu?", [
      { text: "Hủy", style: "cancel" },
      { text: "Thư viện", onPress: () => pickImage('library') },
      { text: "Chụp ảnh", onPress: () => pickImage('camera') },
    ]);
  };

  const pickImage = async (mode: 'camera' | 'library') => {
    let result;
    if (mode === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
          Alert.alert("Lỗi", "Cần cấp quyền Camera để chụp ảnh.");
          return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0].uri) {
      uploadAndDetect(result.assets[0].uri);
    }
  };

  // --- 3. HÀM GỌI API DETECT (Sau khi có ảnh) ---
  const uploadAndDetect = async (uri: string) => {
    setIsDetecting(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'food_image.jpg',
      } as any);

      console.log("Đang gửi ảnh tới:", `${BACKEND_URL}/api/detect`);

      const response = await fetch(`${BACKEND_URL}/api/detect`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      console.log("Kết quả detect:", data);

      if (data.ingredients) {
        router.push({
          pathname: '/ingredients', 
          params: { 
            imageUri: uri,
            ingredients: JSON.stringify(data.ingredients) 
          }
        });
      } else {
        Alert.alert("Lỗi", "Không nhận diện được thực phẩm nào.");
      }

    } catch (error) {
      console.error("Lỗi upload:", error);
      Alert.alert("Lỗi mạng", "Không thể kết nối tới Server nhận diện.");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Loading Overlay khi đang nhận diện ảnh */}
      {isDetecting && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FDD835" />
            <Text style={{color: 'white', marginTop: 10, fontWeight: 'bold'}}>Đang nhận diện món ăn...</Text>
        </View>
      )}

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Nana AI</Text>
        <TouchableOpacity style={styles.scanBtn} onPress={handleCameraPress}>
          <MaterialCommunityIcons name="line-scan" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* --- NỘI DUNG CHAT --- */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContent} 
          contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[
              styles.msgRow, 
              msg.sender === 'user' ? styles.msgRowUser : styles.msgRowBot
            ]}>
              {msg.sender === 'bot' && (
                <Image source={{ uri: botAvatar }} style={styles.avatar} />
              )}
              <View style={[
                styles.bubble, 
                msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot
              ]}>
                <Text style={styles.msgText}>{msg.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* --- FOOTER --- */}
        <View style={styles.footerContainer}>
          {/* Gợi ý */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionRow}>
            <TouchableOpacity style={styles.chip} onPress={() => setInputText("Gợi ý bữa trưa")}>
              <Text style={styles.chipIcon}>🍱</Text>
              <Text style={styles.chipText}>Gợi ý bữa trưa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => setInputText("Gợi ý bữa tối")}>
              <Text style={styles.chipIcon}>🍗</Text>
              <Text style={styles.chipText}>Gợi ý bữa tối</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Ô nhập liệu */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={isSending ? "Nana đang trả lời..." : "Nhập tin nhắn..."}
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              editable={!isSending}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={isSending}>
              <Ionicons 
                name="paper-plane-outline" 
                size={24} 
                color={isSending ? "#ccc" : "#666"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Header
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 15, borderBottomWidth: 1, borderColor: '#eee', 
    paddingTop: Platform.OS === 'android' ? 40 : 15 
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' }, 
  scanBtn: { padding: 5 }, 

  // Chat Area
  chatContent: { flex: 1, backgroundColor: '#fff' },
  msgRow: { marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },

  avatar: { 
    width: 45, height: 45, borderRadius: 22.5, marginRight: 10,
    borderWidth: 1, borderColor: '#FDD835' 
  },
  bubble: { 
    padding: 15, borderRadius: 18, maxWidth: '75%',
    shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1
  },
  bubbleBot: { 
    backgroundColor: '#fff', 
    borderWidth: 1.5, borderColor: '#FDD835', 
    borderTopLeftRadius: 4 
  },
  bubbleUser: { 
    backgroundColor: '#E0E0E0', 
    borderTopRightRadius: 4 
  },
  msgText: { fontSize: 15, color: '#333', lineHeight: 22 },

  // Footer
  footerContainer: { 
    backgroundColor: '#D9D9D9', padding: 15, 
    borderTopLeftRadius: 25, borderTopRightRadius: 25 
  },
  suggestionRow: { marginBottom: 15, flexDirection: 'row' },
  chip: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 10 
  },
  chipIcon: { fontSize: 18, marginRight: 5 },
  chipText: { fontSize: 14, fontWeight: '500', color: '#333' },

  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 15, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FDD835' 
  },
  input: { flex: 1, height: 40, fontSize: 16, color: '#333' },
  sendBtn: { marginLeft: 10 },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', zIndex: 999
  }
});