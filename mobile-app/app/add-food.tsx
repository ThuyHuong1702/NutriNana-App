import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Dimensions, Animated, Modal, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// 👇 Thay IP máy tính của bạn vào đây
const BACKEND_URL = 'http://192.168.1.3:8000'; 
const { width, height } = Dimensions.get('window');

const FOOD_CATEGORIES = [
  "Phổ biến", "Gần đây", "Yêu thích", "Tự tạo", "Kế hoạch", 
  "Ngũ cốc", "Thịt - Sữa - Trứng", "Thủy hải sản", "Rau - củ - quả", "Đồ uống", "Ăn vặt"
];

const EXERCISE_CATEGORIES = ["Phổ biến", "Gần đây", "Yêu thích"];

// --- 1. COMPONENT BÀN PHÍM SỐ (Giữ nguyên) ---
const NumberKeypad = ({ onPress, onDelete, onSave }: any) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '.'];
  return (
    <View style={styles.keypadContainer}>
      <View style={styles.keysGrid}>
        {keys.map((key, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.keyBtn} 
            onPress={() => key ? onPress(key) : null}
            disabled={!key}
          >
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.backspaceBtn} onPress={onDelete}>
          <Ionicons name="backspace-outline" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtnKeypad} onPress={onSave}>
          <Text style={styles.saveTextKeypad}>Lưu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- 2. MODAL CHI TIẾT MÓN ĂN ---
const FoodDetailModal = ({ visible, item, isExercise, backendUrl, onClose, onAddToCart }: any) => {
  const [amountStr, setAmountStr] = useState('1'); 
  const scaleAnim = useRef(new Animated.Value(1)).current; // Animation cho nút Lưu

  useEffect(() => {
    if (visible) setAmountStr('1');
  }, [visible, item]);

  if (!item) return null;

  const name = isExercise ? item.name : item.DISH_NAME;
  const unitName = isExercise ? item.unit : (item.UNIT || 'phần');
  
  const dbImagePath = isExercise ? item.image_url : item.IMAGE_PATH;
  let imageSource = isExercise ? require('@/assets/images/food-tray.png') : require('@/assets/images/react-logo.png');
  
  if (dbImagePath) {
      if (dbImagePath.startsWith('http')) {
          imageSource = { uri: dbImagePath };
      } else {
          const cleanPath = dbImagePath.startsWith('/') ? dbImagePath.substring(1) : dbImagePath;
          imageSource = { uri: `${backendUrl}/${cleanPath}` };
      }
  }

  // Tính toán
  const quantity = parseFloat(amountStr) || 0;
  const baseCal = isExercise ? item.cal_per_unit : item.CALORIES;
  const totalCal = Math.round(baseCal * quantity);
  const totalCarb = ((item.CARB || 0) * quantity).toFixed(1);
  const totalProtein = ((item.PROTEIN || 0) * quantity).toFixed(1);
  const totalFat = ((item.FAT || 0) * quantity).toFixed(1);

  const handleKeyPress = (key: string) => {
    if (amountStr === '0' && key !== '.') setAmountStr(key);
    else if (amountStr.length < 5) setAmountStr(prev => prev + key);
  };

  const handleDelete = () => {
    setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleSave = () => {
    // Hiệu ứng nảy nút Lưu trước khi đóng
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true })
    ]).start(() => {
       onClose(); 
       // Gọi hàm thêm vào giỏ ở màn hình cha
       if (onAddToCart) onAddToCart();
    });
  };

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      transparent={true} 
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          
          <View style={styles.modalHeader}>
            <Text style={styles.headerTitle}>Chi tiết món ăn</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={26} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.infoRow}>
                <Image source={imageSource} style={styles.foodImageDetail} resizeMode="cover" />
                <View style={styles.nameContainer}>
                    <Text style={styles.foodNameDetail}>{name}</Text>
                    <View style={styles.tipBanner}>
                        <Ionicons name="leaf" size={12} color="#FFF" style={{marginRight: 5}}/>
                        <Text style={styles.tipText}>Healthy choice</Text>
                    </View>
                </View>
            </View>

            {!isExercise && (
                <View style={styles.macroRow}>
                    <View style={styles.macroItem}>
                        <Text style={[styles.macroLabel, {color: '#4CAF50'}]}>Calories</Text>
                        <Text style={styles.macroValue}>{totalCal}</Text>
                    </View>
                    <View style={styles.macroItem}>
                        <Text style={[styles.macroLabel, {color: '#2196F3'}]}>Carbs</Text>
                        <Text style={styles.macroValue}>{totalCarb}g</Text>
                    </View>
                    <View style={styles.macroItem}>
                        <Text style={[styles.macroLabel, {color: '#E91E63'}]}>Protein</Text>
                        <Text style={styles.macroValue}>{totalProtein}g</Text>
                    </View>
                    <View style={styles.macroItem}>
                        <Text style={[styles.macroLabel, {color: '#FF9800'}]}>Fat</Text>
                        <Text style={styles.macroValue}>{totalFat}g</Text>
                    </View>
                </View>
            )}
            
            <View style={styles.amountDisplay}>
                <Text style={styles.amountNumber}>{amountStr}</Text>
                <Text style={styles.amountUnit}>{unitName}</Text>
            </View>
          </ScrollView>

          <NumberKeypad onPress={handleKeyPress} onDelete={handleDelete} onSave={handleSave} />
        </View>
      </View>
    </Modal>
  );
};

// --- 3. COMPONENT DÒNG MÓN ĂN (Với Animation nút cộng) ---
const FoodItemRow = ({ item, isExercise, onAdd, onItemPress, backendUrl }: any) => {
  // Animation cho nút cộng
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleAddPress = () => {
    // 1. Chạy hiệu ứng co giãn nút
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 100, useNativeDriver: true }), // Thu nhỏ
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }), // Phóng to
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),   // Về bình thường
    ]).start();

    // 2. Gọi hàm thêm
    onAdd();
  };

  const name = isExercise ? item.name : item.DISH_NAME; 
  const cal = isExercise ? item.cal_per_unit : item.CALORIES;
  const unit = isExercise ? item.unit : item.UNIT;
  const dbImagePath = isExercise ? item.image_url : item.IMAGE_PATH;

  let imageSource = isExercise ? require('@/assets/images/food-tray.png') : require('@/assets/images/react-logo.png');
  if (dbImagePath) {
      if (dbImagePath.startsWith('http')) imageSource = { uri: dbImagePath };
      else {
          const cleanPath = dbImagePath.startsWith('/') ? dbImagePath.substring(1) : dbImagePath;
          imageSource = { uri: `${backendUrl}/${cleanPath}` };
      }
  }

  return (
    <View style={styles.itemRow}>
      <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center'}} onPress={() => onItemPress(item)}>
        <Image source={imageSource} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemDesc}>
            {isExercise ? `🔥 Tiêu thụ ${cal} calo / ${unit}` : `🍽️ ${cal} calo / ${unit}`}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Nút cộng có Animation */}
      <TouchableOpacity onPress={handleAddPress} activeOpacity={0.8} style={styles.addBtnTouch}>
        <Animated.View style={[styles.addBtn, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="add" size={24} color="#FDD835" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

// --- COMPONENT CHÍNH ---
export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealLabel = params.meal as string || "Bữa sáng"; 
  const isExercise = mealLabel === "Vận động";
  const categories = isExercise ? EXERCISE_CATEGORIES : FOOD_CATEGORIES;

  const [selectedCategory, setSelectedCategory] = useState("Phổ biến");
  const [cartCount, setCartCount] = useState(0);
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Animation State cho Giỏ hàng
  const cartScaleAnim = useRef(new Animated.Value(1)).current; 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = isExercise ? '/api/activities' : '/api/foods';
        const response = await axios.get(`${BACKEND_URL}${endpoint}`);
        if (response.data.success) {
          setListData(response.data.data);
        }
      } catch (error) {
        console.log("Lỗi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isExercise]);

  // Hàm xử lý thêm vào giỏ (Dùng chung cho cả nút + và Modal)
  const handleAddToCart = () => {
    // 1. Tăng số lượng
    setCartCount(prev => prev + 1);

    // 2. Rung giỏ hàng (Pulse Effect)
    cartScaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(cartScaleAnim, { toValue: 1.5, duration: 150, useNativeDriver: true }), // Phóng to mạnh
      Animated.timing(cartScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true })    // Thu về
    ]).start();
  };

  const handleItemPress = (item: any) => {
      setSelectedItem(item);
      setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.dateSelector}>
          <TouchableOpacity><Ionicons name="chevron-back" size={20} color="#333" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Hôm nay</Text>
          <TouchableOpacity><Ionicons name="chevron-forward" size={20} color="#333" /></TouchableOpacity>
        </View>
        <View style={{width: 24}} /> 
      </View>

      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#333" style={{marginRight: 10}} />
          <TextInput 
            placeholder={isExercise ? "Tìm bài tập..." : "Tìm kiếm thực phẩm..."} 
            style={styles.searchInput}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* BODY */}
      <View style={styles.contentRow}>
        <View style={styles.sidebar}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.catItem, selectedCategory === item && styles.selectedCat]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.catText, selectedCategory === item && styles.selectedCatText]}>{item}</Text>
                {selectedCategory === item && <View style={styles.activeBar} />}
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#FDD835" style={{marginTop: 20}} />
          ) : (
            <FlatList
              data={listData}
              keyExtractor={(item) => item.id ? item.id.toString() : (item.C_FOOD_ID ? item.C_FOOD_ID.toString() : Math.random().toString())}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 100}}
              ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#999'}}>Chưa có dữ liệu</Text>}
              renderItem={({ item }) => (
                <FoodItemRow 
                  item={item} 
                  isExercise={isExercise} 
                  backendUrl={BACKEND_URL}
                  onAdd={handleAddToCart} // Truyền hàm xử lý thêm vào giỏ
                  onItemPress={handleItemPress} 
                />
              )}
            />
          )}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {/* 👇 Biểu tượng giỏ hàng NẢY LÊN (Pulse) */}
          <Animated.View style={[styles.dishIcon, { transform: [{ scale: cartScaleAnim }] }]}>
            <Image 
              source={isExercise ? require('@/assets/images/food-tray.png') : require('@/assets/images/food-tray.png')} 
              style={{width: 32, height: 32}} 
              resizeMode="contain"
            />
            {cartCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
            )}
          </Animated.View>
          
          <View style={{marginLeft: 10}}>
             <Text style={styles.footerMealName}>{isExercise ? "Vận động" : mealLabel}</Text>
             <Ionicons name="caret-up" size={14} color="#666" style={{marginTop: -2}}/>
          </View>
        </View>

        <TouchableOpacity style={styles.finishBtn} onPress={() => router.back()}>
          <Text style={styles.finishText}>Hoàn thành</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL CHI TIẾT */}
      <FoodDetailModal 
        visible={modalVisible} 
        item={selectedItem}
        isExercise={isExercise}
        backendUrl={BACKEND_URL}
        onClose={() => setModalVisible(false)}
        onAddToCart={handleAddToCart} // Khi lưu từ modal cũng nảy giỏ hàng
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10 },
  backBtn: { padding: 5 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDD835', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginHorizontal: 10 },
  searchContainer: { paddingHorizontal: 15, marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FDD835', opacity: 0.8 },
  searchInput: { flex: 1, fontSize: 16, color: '#333' },
  contentRow: { flex: 1, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  sidebar: { width: '28%', backgroundColor: '#F9F9F9' },
  catItem: { paddingVertical: 18, paddingHorizontal: 5, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  selectedCat: { backgroundColor: '#FFF' },
  catText: { fontSize: 13, color: '#666', textAlign: 'center', fontWeight: '500' },
  selectedCatText: { color: '#D4A017', fontWeight: 'bold' },
  activeBar: { position: 'absolute', left: 0, top: 15, bottom: 15, width: 4, backgroundColor: '#FDD835', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  listContainer: { width: '72%', backgroundColor: '#FFF', paddingHorizontal: 15 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemImage: { width: 45, height: 45, borderRadius: 8, marginRight: 12, backgroundColor: '#EEE' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  addBtnTouch: { padding: 5 },
  addBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', borderRadius: 18, backgroundColor: '#FAFAFA' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#FFF', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3, zIndex: 999 },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  dishIcon: { marginRight: 10 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FF5252', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  footerMealName: { fontSize: 15, color: '#444', fontWeight: 'bold', marginRight: 4 },
  finishBtn: { backgroundColor: '#FDD835', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25 },
  finishText: { fontWeight: 'bold', color: '#333', fontSize: 15 },
  
  // MODAL STYLES (Đã sửa lỗi trùng lặp và làm gọn)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxHeight: '80%', backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  closeBtn: { padding: 5 },
  //headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollContent: { alignItems: 'center', paddingBottom: 20, paddingTop: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 20, marginBottom: 20 },
  foodImageDetail: { width: 80, height: 80, borderRadius: 40, marginRight: 15, borderWidth: 1, borderColor: '#EEE' },
  nameContainer: { flex: 1 },
  foodNameDetail: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  tipBanner: { backgroundColor: '#FDD835', flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 15, alignSelf: 'flex-start' },
  tipText: { color: '#FFF', fontWeight: '500', fontSize: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20, paddingHorizontal: 10 },
  macroItem: { alignItems: 'center' },
  macroLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  macroValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  amountDisplay: { alignItems: 'center', marginBottom: 10 },
  amountNumber: { fontSize: 48, fontWeight: 'bold', color: '#FDD835' },
  amountUnit: { fontSize: 16, color: '#888' },
  
  // Keypad
  keypadContainer: { flexDirection: 'row', height: 240, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#FAFAFA' },
  keysGrid: { flex: 3, flexDirection: 'row', flexWrap: 'wrap', borderRightWidth: 1, borderRightColor: '#EEE' },
  keyBtn: { width: '33.33%', height: '25%', justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
  keyText: { fontSize: 22, fontWeight: '500', color: '#333' },
  actionColumn: { flex: 1 },
  backspaceBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
  saveBtnKeypad: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDD835' },
  saveTextKeypad: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});