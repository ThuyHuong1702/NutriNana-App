// app/add-food.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, Alert, Platform, PixelRatio } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { auth } from '@/src/config/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import this

// 👇 Import components
import { ListingLayout } from '@/src/components/listing/ListingLayout';
import FoodModal from '@/src/components/FoodModal';
import CartTrayModal from '@/src/components/CartTrayModal'; 

// 👇 CONFIG
const BACKEND_URL = 'http://192.168.1.3:8000'; // Replace with your IP
const FOOD_CATEGORIES = [
  "Phổ biến", "Gần đây", "Yêu thích", "Tự tạo", "Kế hoạch", 
  "Cơm phần", "Món mặn", "Đồ ăn liền", "Cháo", "Canh", 
  "Bánh, kẹo, đồ ngọt", "Đồ ăn tiện lợi", "Đồ ăn vặt", "Đồ uống"
];
const CART_TABS = ["Sáng", "Trưa", "Tối", "Phụ"];

// 👇 Helper function to create empty cart
const createEmptyCart = () => CART_TABS.reduce((acc, tab) => ({ ...acc, [tab]: [] }), {});

export default function AddFoodScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets(); // Get safe area insets
    
    // --- 1. STATE MANAGEMENT ---
    const mealLabel = (params.meal as string) || "Bữa sáng";
    const cartKey = mealLabel.replace("Bữa ", ""); // e.g., "Sáng"

    const selectedDate = (params.date as string) || new Date().toISOString().split('T')[0];

    const [selectedCategory, setSelectedCategory] = useState(FOOD_CATEGORIES[0]);
    const [searchText, setSearchText] = useState("");
    const [listData, setListData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- 2. CART STATE & MODAL ---
    const [cartItems, setCartItems] = useState<any>(createEmptyCart());
    
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [trayVisible, setTrayVisible] = useState(false);
    
    // Animation for cart icon
    const cartScaleAnim = useRef(new Animated.Value(1)).current;
    const cartCount = useMemo(() => Object.values(cartItems).flat().length, [cartItems]);

    // --- 3. FETCH DATA ---
    useEffect(() => {
        const fetchListData = async () => {
            setLoading(true);
            try {
                let url = "";
                if (searchText.trim().length > 0) {
                    url = `${BACKEND_URL}/api/search-food?q=${encodeURIComponent(searchText.trim())}`;
                } else {
                    if (selectedCategory === "Kế hoạch") {
                        setListData([]); setLoading(false); return;
                    }
                    else if (selectedCategory === "Gần đây") {
                         if (auth.currentUser) url = `${BACKEND_URL}/api/get-recent-foods/${auth.currentUser.uid}`;
                         else { setListData([]); setLoading(false); return; }
                    } 
                    else if (selectedCategory === "Yêu thích") {
                         if (auth.currentUser) url = `${BACKEND_URL}/api/get-favorite-foods/${auth.currentUser.uid}`;
                         else { setListData([]); setLoading(false); return; }
                    }
                    else if (selectedCategory === "Phổ biến") {
                        url = `${BACKEND_URL}/api/foods`;
                    }
                    else {
                        url = `${BACKEND_URL}/api/get-foods-by-category?category=${encodeURIComponent(selectedCategory)}`;
                    }
                }

                console.log("Fetching Food URL:", url);
                const res = await axios.get(url);
                if (res.data.success) setListData(res.data.data);
                else setListData([]);

            } catch (err) {
                console.log("Error fetching food:", err);
                setListData([]);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchListData, 500);
        return () => clearTimeout(timeout);
    }, [selectedCategory, searchText]);

    // --- 4. FETCH DIARY (Load cart) ---
    useEffect(() => {
        const fetchUserLog = async () => {
            let newCart: any = createEmptyCart();
            try {
                if (!auth.currentUser) {
                    setCartItems(newCart);
                    return;
                }
                
                const uid = auth.currentUser.uid;
                const res = await axios.get(`${BACKEND_URL}/api/get-daily-log/${uid}?date_str=${selectedDate}`);
                
                if (res.data.success && Array.isArray(res.data.data)) {
                    res.data.data.forEach((log: any) => {
                        if (newCart[log.meal_label]) {
                            const mappedItem = {
                                id: log.C_FOOD_ID,
                                logId: log.F_LOG_ID,
                                displayName: log.DISH_NAME,
                                displayCal: log.LOG_CAL, 
                                quantity: log.QUANTITY,
                                unit: log.UNIT || 'phần',
                                displayImage: log.IMAGE_PATH ? (log.IMAGE_PATH.startsWith('http') ? { uri: log.IMAGE_PATH } : { uri: `${BACKEND_URL}/${log.IMAGE_PATH}` }) : null,
                                CALORIES: log.BASE_CAL,         
                                PROTEIN: log.BASE_PROTEIN || 0, 
                                CARB: log.BASE_CARB || 0,
                                FAT: log.BASE_FAT || 0,
                                ...log 
                            };
                            newCart[log.meal_label].push(mappedItem);
                        }
                    });
                }
            } catch (error) {
                console.log("Error fetching daily log:", error);
            } finally {
                setCartItems(newCart);
            }
        };
        fetchUserLog();
    }, [selectedDate]);

    // --- 5. ADD TO CART ---
    const handleAddToCart = async (itemToAdd: any) => {
        if (itemToAdd.quantity <= 0) {
            handleRemoveFromCart(cartKey, -1, itemToAdd); 
            return;
        }

        setCartItems((prev: any) => {
            const newList = [...(prev[cartKey] || [])];
            const idx = newList.findIndex((i: any) => (i.id || i.C_FOOD_ID) === (itemToAdd.id || itemToAdd.C_FOOD_ID));
            if (idx > -1) newList[idx] = { ...newList[idx], ...itemToAdd };
            else newList.push(itemToAdd);
            return { ...prev, [cartKey]: newList };
        });

        try {
            if (!auth.currentUser) return;
            const payload = {
                firebase_id: auth.currentUser.uid,
                food_id: itemToAdd.id || itemToAdd.C_FOOD_ID,
                meal_label: cartKey, 
                quantity: itemToAdd.quantity,
                log_date: selectedDate,
                calories: itemToAdd.displayCal || 0,
                protein: itemToAdd.PROTEIN ? itemToAdd.PROTEIN * itemToAdd.quantity : 0,
                carb: itemToAdd.CARB ? itemToAdd.CARB * itemToAdd.quantity : 0,
                fat: itemToAdd.FAT ? itemToAdd.FAT * itemToAdd.quantity : 0
            };
            await axios.post(`${BACKEND_URL}/api/log-food`, payload);
        } catch (e) { 
            console.log("❌ Log API error:", e); 
        }

        cartScaleAnim.setValue(1);
        Animated.sequence([
            Animated.timing(cartScaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
            Animated.timing(cartScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true })
        ]).start();
    };

    // --- 6. REMOVE FROM CART ---
    const handleRemoveFromCart = async (tabKey: string, index: number, itemData?: any) => {
        let itemToDelete = itemData;
        if (!itemToDelete && index >= 0) itemToDelete = cartItems[tabKey][index];

        setCartItems((prev: any) => {
             const newList = [...(prev[tabKey] || [])];
             if(index >= 0) {
                 newList.splice(index, 1);
             } else if (itemToDelete) {
                 const idx = newList.findIndex((i:any) => (i.id || i.C_FOOD_ID) === (itemToDelete.id || itemToDelete.C_FOOD_ID));
                 if(idx > -1) newList.splice(idx, 1);
             }
             return { ...prev, [tabKey]: newList };
        });

        try {
             if(auth.currentUser && itemToDelete) {
                 const payload = {
                     firebase_id: auth.currentUser.uid,
                     food_id: itemToDelete.id || itemToDelete.C_FOOD_ID,
                     meal_label: tabKey,
                     quantity: 0, 
                     log_date: selectedDate,
                     calories: 0, protein: 0, carb: 0, fat: 0
                 };
                 await axios.post(`${BACKEND_URL}/api/log-food`, payload);
             }
        } catch(e) { console.log("Remove API error:", e); }
    };

    // --- RENDER COMPONENTS ---
    // Render 1 food item row
    const renderFoodItem = ({ item }: { item: any }) => {
        const name = item.displayName || item.DISH_NAME || item.name;
        const cal = item.CALORIES || item.cal_per_unit || 0;
        const unit = item.UNIT || item.unit || 'phần';
        
        let imageSource = require('@/assets/images/react-logo.png');
        const dbPath = item.IMAGE_PATH || item.image_url;
        if (dbPath) {
            imageSource = dbPath.startsWith('http') ? { uri: dbPath } : { uri: `${BACKEND_URL}/${dbPath}` };
        }

        const isAdded = (cartItems[cartKey] || []).some((i: any) => 
            (i.id || i.C_FOOD_ID) === (item.id || item.C_FOOD_ID)
        );

        const currentCartList = cartItems[cartKey] || [];
        const existingItem = currentCartList.find((i: any) => 
            (i.id || i.C_FOOD_ID) === (item.id || item.C_FOOD_ID)
        );

        return (
            <TouchableOpacity 
                style={styles.itemRow} 
                onPress={() => { setSelectedItem(existingItem || item); setDetailModalVisible(true); }}
                activeOpacity={0.7}
                // Accessibility props
                accessible={true}
                accessibilityLabel={`${name}, ${cal} calories per ${unit}`}
                accessibilityRole="button"
            >
                <Image source={imageSource} style={styles.itemImage} resizeMode="cover"/>
                <View style={styles.itemInfo}>
                    {/* Allow text to scale and wrap */}
                    <Text style={styles.itemName} numberOfLines={2} adjustsFontSizeToFit={false}>{name}</Text>
                    <Text style={styles.itemDesc}>{cal} cal / {unit}</Text>
                </View>

                {isAdded ? (
                    <Ionicons name="checkmark-circle" size={28} color="#4CAF50"/>
                ) : (
                    <View style={styles.addButton}>
                        <Ionicons name="add" size={24} color="#FDD835"/>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Render Empty State
    const renderEmptyState = () => {
        if (loading) return null;

        // 1. PRO FEATURE
        if (selectedCategory === "Kế hoạch") {
            return (
                <View style={styles.proContainer}>
                    <View style={styles.proIconBg}>
                        <Ionicons name="diamond" size={50} color="#FDD835" />
                    </View>
                    <Text style={styles.proTitle}>Tính năng Pro</Text>
                    <Text style={styles.proDesc}>
                        Lên kế hoạch bữa ăn chi tiết, theo dõi calories nâng cao và nhận thực đơn cá nhân hóa.
                    </Text>
                    <TouchableOpacity 
                        style={styles.proButton} 
                        onPress={() => Alert.alert("Thông báo", "Chức năng đang phát triển!")}
                        accessibilityRole="button"
                        accessibilityLabel="Đăng ký Pro ngay"
                    >
                        <Text style={styles.proButtonText}>Đăng ký Pro ngay</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // 2. FAVORITES TAB
        if (selectedCategory === "Yêu thích") {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="nutrition-outline" size={60} color="#BDBDBD" />
                    <Text style={styles.emptyText}>Chưa có món ăn yêu thích</Text>
                    <Text style={styles.emptySubText}>
                        Món ăn sẽ tự động xuất hiện ở đây sau khi bạn ăn trên 5 lần.
                    </Text>
                </View>
            );
        }

        // 3. RECENT TAB
        if (selectedCategory === "Gần đây") {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="time-outline" size={60} color="#BDBDBD" />
                    <Text style={styles.emptyText}>Chưa có lịch sử ăn uống</Text>
                    <Text style={styles.emptySubText}>Các món bạn ăn gần đây sẽ hiện ở đây.</Text>
                </View>
            );
        }

        // 4. DEFAULT
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="clipboard-outline" size={60} color="#BDBDBD"/>
                <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            </View>
        );
    };

    // Footer Component
    const FoodFooter = () => (
        <View style={[styles.footerShadow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity 
                style={styles.footerLeft} 
                onPress={() => cartCount > 0 && setTrayVisible(true)}
                disabled={cartCount === 0}
                accessibilityRole="button"
                accessibilityLabel={`Giỏ hàng ${cartKey}, ${cartCount} món đã chọn`}
            >
                <Animated.View style={{ transform: [{ scale: cartScaleAnim }] }}>
                    <Image 
                        source={require('@/assets/images/food-tray.png')} 
                        style={{ 
                            width: 32, 
                            height: 32,
                            opacity: cartCount > 0 ? 1 : 0.5 
                        }}
                        resizeMode="contain"
                    />

                    {cartCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{cartCount}</Text>
                        </View>
                    )}
                </Animated.View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.footerMealName} numberOfLines={1}>{cartKey}</Text>
                    <Text style={styles.footerSubText} numberOfLines={1}>
                        {cartCount > 0 ? `${cartCount} món đã chọn` : "Chưa chọn món"}
                    </Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.finishBtn} 
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Hoàn thành chọn món"
            >
                <Text style={styles.finishText}>Hoàn thành</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <>
            <ListingLayout
                title={mealLabel}
                searchPlaceholder="Tìm món ăn..."
                searchText={searchText}
                setSearchText={setSearchText}
                categories={FOOD_CATEGORIES}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                loading={loading}
                data={listData}
                renderItem={renderFoodItem}
                renderEmptyComponent={renderEmptyState}
                footerComponent={<FoodFooter />}
            />

            <FoodModal
                visible={detailModalVisible}
                item={selectedItem}
                onClose={() => setDetailModalVisible(false)}
                onAddToCart={handleAddToCart}
                backendUrl={BACKEND_URL}
            />

            <CartTrayModal 
                visible={trayVisible} 
                onClose={() => setTrayVisible(false)}
                cartItems={cartItems}
                onRemoveItem={handleRemoveFromCart}
                currentMealLabel={cartKey}
                tabs={CART_TABS}
                onItemPress={(item) => { setSelectedItem(item); setDetailModalVisible(true); }}
            />
        </>
    );
}

const styles = StyleSheet.create({
    itemRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F0F0F0',
        minHeight: 80 // Ensure minimum height for touch target
    },
    itemImage: { 
        width: 56, 
        height: 56, 
        borderRadius: 12, 
        marginRight: 12, 
        backgroundColor: '#EEE' 
    },
    itemInfo: { 
        flex: 1, 
        justifyContent: 'center',
        paddingRight: 8 // Add padding to avoid overlap with button
    },
    itemName: { 
        fontSize: 15, 
        fontWeight: '600', 
        color: '#333', 
        marginBottom: 4,
        flexWrap: 'wrap' // Allow wrapping
    },
    itemDesc: { 
        fontSize: 12, 
        color: '#888' 
    },
    addButton: { 
        padding: 8, // Increase padding for easier tapping
    },
    footerShadow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingTop: 12, 
        borderTopWidth: 1, 
        borderTopColor: '#EEE', 
        backgroundColor: '#FFF',
        elevation: 10, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -3 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 4
    },
    footerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        flex: 1,
        marginRight: 10 // Prevent text from hitting the button
    },
    footerMealName: { 
        fontSize: 15, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    footerSubText: { 
        fontSize: 12, 
        color: '#666' 
    },
    finishBtn: { 
        backgroundColor: '#FDD835', 
        paddingVertical: 10, 
        paddingHorizontal: 24, 
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center'
    },
    finishText: { 
        fontWeight: 'bold', 
        color: '#333',
        fontSize: 14 // Explicit font size
    },
    badge: { 
        position: 'absolute', 
        top: -5, 
        right: -5, 
        backgroundColor: 'red', 
        borderRadius: 10, 
        minWidth: 16, // Use minWidth to allow growth for 2 digits
        height: 16, 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingHorizontal: 2
    },
    badgeText: { 
        color: '#fff', 
        fontSize: 10, 
        fontWeight: 'bold' 
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 20,
        opacity: 0.8
    },
    emptyText: {
        marginTop: 15,
        color: '#757575',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    emptySubText: {
        marginTop: 8,
        color: '#9E9E9E',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18
    },
    // PRO Feature styles
    proContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 30,
        paddingBottom: 40 // Add padding for scrolling
    },
    proIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF9C4', 
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    proTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center'
    },
    proDesc: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    proButton: {
        backgroundColor: '#FDD835',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: "#FDD835",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        minWidth: 200, 
        alignItems: 'center'
    },
    proButtonText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase'
    }
});