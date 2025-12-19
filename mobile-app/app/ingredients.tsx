// File: app/ingredients.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, FlatList, 
  TextInput, Alert, Platform, ActivityIndicator, KeyboardAvoidingView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '@/src/config/firebase'; 

import { getFoodName } from '../utils/foodDictionary';

export default function IngredientScreen() {
  const router = useRouter();
  const { imageUri, ingredients } = useLocalSearchParams();
  
  const [items, setItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (ingredients) {
      try {
        const parsed = JSON.parse(ingredients as string);
        const displayItems = parsed.map((rawKey: string) => getFoodName(rawKey));
        setItems(displayItems);
      } catch (e) {
        setItems([]);
      }
    }
  }, [ingredients]);

  const handleDelete = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleEdit = (index: number, currentName: string) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Sửa tên', '', 
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Lưu', onPress: (text?: string) => updateItem(index, text) }
        ], 
        'plain-text', currentName
      );
    } else {
        Alert.alert("Thông báo", "Vui lòng xóa đi và thêm lại trên Android.");
    }
  };

  const updateItem = (index: number, text?: string) => {
    if (text) {
      const newItems = [...items];
      newItems[index] = text;
      setItems(newItems);
    }
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      setItems([...items, newItemText.trim()]);
      setNewItemText('');
      setIsAdding(false);
    }
  };

  // --- HÀM GỌI API ---
  const handleContinue = async () => {
    if (items.length === 0) {
      Alert.alert("Thông báo", "Danh sách nguyên liệu đang trống!");
      return;
    }

    const currentUser = auth.currentUser; 

    if (!currentUser) {
      Alert.alert("Lỗi", "Bạn chưa đăng nhập! Vui lòng đăng nhập lại.");
      return;
    }

    setIsProcessing(true);

    try {
      const BACKEND_URL = 'http://192.168.1.3:8000'; 
      
      console.log("Đang gửi đến:", `${BACKEND_URL}/api/suggest`);

      const response = await fetch(`${BACKEND_URL}/api/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_id: currentUser.uid, 
          ingredients: items 
        })
      });

      const data = await response.json();

      setIsProcessing(false);

      if (data.success) {
        router.push({
          pathname: '/chat',
          params: { aiReply: data.reply }
        });
      } else {
        Alert.alert("Lỗi Backend", "Không thể lấy gợi ý món ăn.");
      }

    } catch (error) {
      setIsProcessing(false);
      console.error(error);
      Alert.alert("Lỗi kết nối", "Không thể kết nối Server.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isProcessing && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FDD835" />
            <Text style={styles.loadingText}>Nana đang suy nghĩ thực đơn...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={30} color="#333" />
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        {imageUri ? (
             <Image source={{ uri: imageUri as string }} style={styles.image} resizeMode="cover" />
        ) : (
            <View style={[styles.image, {backgroundColor: '#ccc'}]} />
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Thành phần ({items.length})</Text>

        <FlatList
          data={items}
          keyExtractor={(item, index) => index.toString() + Math.random()}
          style={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.itemRow}>
              <Text style={styles.itemText}>{item}</Text>
              <View style={styles.actionIcons}>
                <TouchableOpacity onPress={() => handleEdit(index, item)} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={20} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(index)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={() => (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              {isAdding ? (
                <View style={styles.addItemRow}>
                    <TextInput 
                        style={styles.input}
                        placeholder="Nhập tên..."
                        value={newItemText}
                        onChangeText={setNewItemText}
                        autoFocus
                    />
                    <TouchableOpacity onPress={handleAddItem}>
                        <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
                    </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
                    <Text style={styles.addButtonText}>Thêm nguyên liệu khác</Text>
                    <Ionicons name="add-circle" size={24} color="#ccc" />
                </TouchableOpacity>
              )}
               <View style={{height: 60}} />
            </KeyboardAvoidingView>
          )}
        />

        <View style={styles.footerContainer}>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
             <Text style={styles.continueText}>Tiếp tục</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  closeButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  imageContainer: { height: 200, width: '100%', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  body: { flex: 1, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  list: { flex: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemText: { fontSize: 16, color: '#333' },
  actionIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },
  footerContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  continueButton: { backgroundColor: '#FDD835', padding: 15, borderRadius: 30, alignItems: 'center' },
  continueText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: 15 },
  addButtonText: { marginRight: 5, color: '#888' },
  addItemRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, borderBottomWidth: 1, borderColor: '#4CAF50' },
  input: { flex: 1, padding: 10, fontSize: 16 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 999,
  },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 16, fontWeight: '600' }
});