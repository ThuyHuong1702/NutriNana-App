// File: app/ingredients.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, FlatList, 
  TextInput, Alert, Platform, ActivityIndicator, KeyboardAvoidingView, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@/src/config/firebase'; 
import { getFoodName } from '../utils/foodDictionary';
import { BACKEND_URL } from '@/src/config/apiConfig';

export default function IngredientScreen() {
  const router = useRouter();
  const { imageUri, ingredients } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  
  // State
  const [items, setItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse dữ liệu ban đầu
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
    Alert.alert("Xóa nguyên liệu", "Bạn chắc chắn muốn xóa?", [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: 'destructive', onPress: () => {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }}
    ]);
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
    if (text && text.trim()) {
      const newItems = [...items];
      newItems[index] = text.trim();
      setItems(newItems);
    }
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      setItems(prev => [...prev, newItemText.trim()]);
      setNewItemText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewItemText('');
    Keyboard.dismiss();
  };

  const handleContinue = async () => {
    if (items.length === 0) {
      Alert.alert("Thông báo", "Danh sách nguyên liệu đang trống!");
      return;
    }
    const currentUser = auth.currentUser; 
    if (!currentUser) return;

    setIsProcessing(true);
    try {
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
        router.push({ pathname: '/chat', params: { aiReply: data.reply } });
      } else {
        Alert.alert("Lỗi Backend", "Không thể lấy gợi ý món ăn.");
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Lỗi kết nối", "Không thể kết nối Server.");
    }
  };

  return (
    <View style={styles.container}>
      
      {isProcessing && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FDD835" />
            <Text style={styles.loadingText}>Đang xử lý...</Text>
        </View>
      )}

      <View style={styles.headerWrapper}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <View style={styles.closeBtnBg}>
                <Ionicons name="close" size={24} color="#333" />
            </View>
        </TouchableOpacity>
        <View style={styles.imageContainer}>
            {imageUri ? (
                <Image source={{ uri: imageUri as string }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={[styles.image, {backgroundColor: '#E0E0E0'}]} />
            )}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.dragHandle} />
        <Text style={styles.title}>Thành phần ({items.length})</Text>

        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
        >
            <FlatList
                ref={flatListRef}
                data={items}
                keyExtractor={(item, index) => `${index}-${item}`}
                style={styles.list}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <View style={styles.itemRow}>
                        <View style={styles.itemContent}>
                            <View style={styles.bullet} />
                            <Text style={styles.itemText}>{item}</Text>
                        </View>
                        <View style={styles.actionIcons}>
                            <TouchableOpacity onPress={() => handleEdit(index, item)} style={styles.iconBtn}>
                                <Ionicons name="pencil" size={18} color="#4CAF50" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(index)} style={styles.iconBtn}>
                                <Ionicons name="trash-outline" size={18} color="#FF5252" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <View style={styles.bottomArea}>
                {isAdding ? (
                    <View style={styles.addItemContainer}>
                        <View style={styles.addItemRow}>
                            <TextInput 
                                style={styles.input}
                                placeholder="Nhập tên nguyên liệu..."
                                placeholderTextColor="#999"
                                value={newItemText}
                                onChangeText={setNewItemText}
                                autoFocus={true} 
                                onSubmitEditing={handleAddItem}
                                returnKeyType="done"
                            />
                            <TouchableOpacity onPress={handleAddItem} style={styles.confirmAddBtn}>
                                <Ionicons name="arrow-up-circle" size={36} color="#FDD835" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.cancelAddBtn} onPress={handleCancelAdd}>
                            <Text style={styles.cancelText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.normalActions}>
                        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
                            <View style={styles.addIconBg}>
                                <Ionicons name="add" size={24} color="#666" />
                            </View>
                            <Text style={styles.addButtonText}>Thêm nguyên liệu khác</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                            <Text style={styles.continueText}>Tiếp tục</Text>
                            <Ionicons name="arrow-forward" size={20} color="#333" style={{marginLeft: 5}}/>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Nền đen
  
  // Header
  headerWrapper: { height: 220, width: '100%' },
  closeButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 }, // Top 50 cho các máy tai thỏ
  closeBtnBg: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 20, padding: 8 },
  imageContainer: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },

  // Body
  body: { 
    flex: 1, 
    backgroundColor: '#fff', 
    marginTop: -30, // Kéo lên đè ảnh
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 20,
    paddingTop: 10,
    overflow: 'hidden'
  },
  dragHandle: { 
    width: 40, height: 5, backgroundColor: '#E0E0E0', 
    borderRadius: 3, alignSelf: 'center', marginBottom: 15, marginTop: 5 
  },
  title: { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 10 },

  // List
  list: { flex: 1 },
  itemRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' 
  },
  itemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FDD835', marginRight: 10 },
  itemText: { fontSize: 16, color: '#333', fontWeight: '500' },
  actionIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },

  // Bottom Area
  bottomArea: {
    paddingVertical: 10,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10 
  },

  // Normal Actions
  normalActions: { gap: 10 },
  addButton: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 8, paddingHorizontal: 5 
  },
  addIconBg: { 
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F5F5', 
    justifyContent: 'center', alignItems: 'center', marginRight: 10 
  },
  addButtonText: { fontSize: 16, color: '#666', fontWeight: '500' },
  
  continueButton: { 
    backgroundColor: '#FDD835', paddingVertical: 15, borderRadius: 16, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 3
  },
  continueText: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  // Input Mode
  addItemContainer: { gap: 5 },
  addItemRow: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#FAFAFA', borderRadius: 12, 
    paddingHorizontal: 15, paddingVertical: 5,
    borderWidth: 1.5, borderColor: '#FDD835'
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },
  confirmAddBtn: { paddingLeft: 10 },
  cancelAddBtn: { alignSelf: 'center', padding: 8 },
  cancelText: { color: '#999', fontSize: 14, fontWeight: '600' },

  // Loading
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 999,
  },
  loadingText: { color: '#fff', marginTop: 15, fontSize: 16, fontWeight: '600' }
});