import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, 
  Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BACKEND_URL } from '@/src/config/apiConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '@/src/config/firebase';
import Markdown from 'react-native-markdown-display';

type AiNutritionData = {
  analysis: string;
  total_calories: number;
  recommendations: Array<{ name: string; icons: string; description: string; }>;
};

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  aiData?: AiNutritionData;
};

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { aiReply } = useLocalSearchParams(); 
  
  // --- States ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);     
  const [isDetecting, setIsDetecting] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const MIMI_AVATAR = require('@/assets/images/banana_mascot.jpg'); 

  // --- 1. Logic Chat Text ---
  const addBotMessage = (content: string) => {
    if (!content) return;
    let newMessage: Message = { id: Date.now().toString(), sender: 'bot' };
    const cleanContent = content.trim();

    try {
      if (cleanContent.startsWith('{') || cleanContent.startsWith('[')) {
        newMessage.aiData = JSON.parse(cleanContent);
      } else {
        newMessage.text = cleanContent;
      }
    } catch (e) {
      newMessage.text = cleanContent;
    }
    setMessages(prev => [...prev, newMessage]);
  };

  useEffect(() => {
    const initial: Message = { 
        id: '1', 
        sender: 'bot', 
        text: 'Mimi đã xem kỹ các nguyên liệu bạn gửi rồi 🍲\nChờ một chút nhé, mình đang chọn ra những món ăn cân bằng dinh dưỡng nhất cho bạn!' 
    };
    setMessages([initial]);
    if (aiReply) setTimeout(() => addBotMessage(aiReply as string), 500);
  }, [aiReply]);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isSending) return;
    
    const userMsg: Message = { id: Date.now().toString(), text: text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    
    setInputText('');
    setIsSending(true);
    const uid = auth.currentUser?.uid;
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, firebase_id: uid})
      });
      const data = await response.json();
      if (data.success) addBotMessage(data.reply);
    } catch (error) {
      addBotMessage("⚠️ Lỗi kết nối server.");
    } finally { setIsSending(false); }
  };

  // --- 2. Logic Camera & Upload ---
  const [isLoading, setIsLoading] = useState(false);
  const uploadAndDetect = async (uri: string) => {
    setIsLoading(true); 
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      // --- KHAI BÁO IP 
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

      setIsLoading(false); 

      // 4. CHUYỂN SANG MÀN HÌNH INGREDIENTS
      router.push({
        pathname: '/ingredients', 
        params: { 
          imageUri: uri,
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
    }
  };

  const handleCameraAction = () => {
    Alert.alert(
      "Chọn ảnh món ăn",
      "Bạn muốn chụp ảnh mới hay chọn từ thư viện?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Thư viện",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images, 
              quality: 0.8,
            });
            if (!result.canceled) uploadAndDetect(result.assets[0].uri);
          }
        },
        {
          text: "Chụp ảnh",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert("Lỗi", "Cần cấp quyền truy cập Camera.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled) uploadAndDetect(result.assets[0].uri);
          }
        }
      ]
    );
  };

  // --- 3. Component Render ---
  const NutritionView = ({ data }: { data: AiNutritionData }) => (
    <View style={styles.aiContainer}>
      <Text style={styles.aiAnalysis}>{data.analysis || "Đang phân tích..."}</Text>
      <View style={styles.caloBadge}>
        <Text style={styles.caloText}>🔥 {data.total_calories ?? 0} kcal</Text>
      </View>
      <Text style={styles.suggestTitle}>Thực đơn gợi ý:</Text>
      {Array.isArray(data.recommendations) ? (
        data.recommendations.map((item, idx) => (
          <View key={idx} style={styles.foodCard}>
            <Text style={styles.foodName}>{item.icons} {item.name}</Text>
            <Text style={styles.foodDesc}>{item.description}</Text>
          </View>
        ))
      ) : <Text>Đang tải món ăn...</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        <TouchableOpacity 
          onPress={() => router.replace('/')} 
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Nana AI</Text>
        
        {/* Nút Camera */}
        <TouchableOpacity style={styles.headerBtn} onPress={handleCameraAction} disabled={isDetecting}>
          {isDetecting ? (
            <ActivityIndicator size="small" color="#FBC02D" />
          ) : (
            <MaterialCommunityIcons name="camera-outline" size={26} color="#666" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView 
          ref={scrollViewRef} 
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.msgRow, msg.sender === 'user' ? styles.msgRowUser : styles.msgRowBot]}>
              {msg.sender === 'bot' && (
                <View style={styles.avatarContainer}>
                   <Image 
                     source={MIMI_AVATAR} 
                     style={styles.avatar} 
                     defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' }}
                   />
                </View>
              )}
              
              <View style={[styles.bubble, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
                {msg.aiData ? (
                  <NutritionView data={msg.aiData} />
                ) : (
                  msg.sender === 'user' ? (
                    <Text style={styles.msgText}>{msg.text}</Text>
                  ) : (
                    <Markdown style={markdownStyles}>
                      {msg.text}
                    </Markdown>
                  )
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* FOOTER: Chips & Input */}
        <View style={styles.footerWrapper}>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
             <TouchableOpacity style={styles.chip} onPress={() => handleSend("Gợi ý bữa trưa")}>
                <Text style={styles.chipIcon}>🍱</Text>
                <Text style={styles.chipText}>Gợi ý bữa trưa</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.chip} onPress={() => handleSend("Gợi ý bữa tối")}>
                <Text style={styles.chipIcon}>🍗</Text>
                <Text style={styles.chipText}>Gợi ý bữa tối</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.chip} onPress={() => handleSend("Ăn gì healthy?")}>
                <Text style={styles.chipIcon}>🥗</Text>
                <Text style={styles.chipText}>Healthy</Text>
             </TouchableOpacity>
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              value={inputText} 
              onChangeText={setInputText} 
              placeholder="Nhập tin nhắn..." 
              placeholderTextColor="#999"
              multiline
            />
            {inputText.length > 0 && (
                <TouchableOpacity onPress={() => handleSend()} disabled={isSending} style={styles.sendBtn}>
                  {isSending ? <ActivityIndicator size="small" color="#FBC02D"/> : <Ionicons name="send" size={20} color="#FBC02D" />}
                </TouchableOpacity>
            )}
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Header
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 15, paddingBottom: 10, 
    borderBottomWidth: 1, borderBottomColor: '#EEE',
    backgroundColor: '#fff',
    zIndex: 10
  },
  headerBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  // Chat Area
  chatContent: { padding: 15, paddingBottom: 20 },
  msgRow: { marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  
  avatarContainer: { 
    marginRight: 10, 
    borderWidth: 2, borderColor: '#FDD835', 
    borderRadius: 20, padding: 2 
  },
  avatar: { width: 35, height: 35, borderRadius: 17.5 },
  
  bubble: { padding: 12, borderRadius: 16, maxWidth: '75%' },
  bubbleBot: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FDD835', borderTopLeftRadius: 4 },
  bubbleUser: { backgroundColor: '#EEEEEE', borderTopRightRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22, color: '#333' },

  // AI Card
  aiContainer: { width: '100%' },
  aiAnalysis: { fontSize: 14, color: '#555', fontStyle: 'italic', marginBottom: 8 },
  caloBadge: { backgroundColor: '#FFF9C4', padding: 5, borderRadius: 5, alignSelf: 'flex-start', marginBottom: 5 },
  caloText: { fontSize: 12, fontWeight: 'bold', color: '#FBC02D' },
  suggestTitle: { fontWeight: 'bold', marginVertical: 5 },
  foodCard: { backgroundColor: '#F9F9F9', padding: 8, borderRadius: 8, marginBottom: 5 },
  foodName: { fontWeight: '600', color: '#333' },
  foodDesc: { fontSize: 12, color: '#666' },

  // Footer
  footerWrapper: {
    backgroundColor: '#CDCDCD',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 10 : 15,
    paddingHorizontal: 15
  },
  suggestionScroll: { marginBottom: 15, maxHeight: 40 },
  chip: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 12, paddingVertical: 8, 
    borderRadius: 20, marginRight: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  chipIcon: { marginRight: 5, fontSize: 16 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#333' },

  inputContainer: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: Platform.OS === 'ios' ? 10 : 5,
    borderWidth: 1.5, borderColor: '#FDD835'
  },
  input: { flex: 1, fontSize: 15, color: '#333', maxHeight: 80 },
  sendBtn: { padding: 5, marginLeft: 5 }
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  strong: {
    fontWeight: 'bold',
    color: '#E65100', 
  },
  list_item: {
    marginVertical: 2,
  },
  bullet_list: {
    marginVertical: 5,
  },
});