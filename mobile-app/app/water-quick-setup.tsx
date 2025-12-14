// app/water-quick-setup.tsx
import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Image, 
    Dimensions, ActivityIndicator, Platform, PixelRatio 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { auth } from '@/src/config/firebase'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 👇 Import quan trọng
import WaterSelectionModal from '@/src/components/WaterSelectionModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKEND_URL = 'http://192.168.1.3:8000'; 

// --- HÀM CHUẨN HÓA KÍCH THƯỚC (RESPONSIVE) ---
const scale = SCREEN_WIDTH / 375; // Dựa trên chuẩn iPhone 11
const normalize = (size: number) => {
    const newSize = size * scale;
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
    }
};

const getImageSource = (path: string) => {
    if (!path) return require('@/assets/images/react-logo.png');
    return path.startsWith('http') ? { uri: path } : { uri: `${BACKEND_URL}/${path}` };
};

export default function WaterQuickSetupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets(); // Lấy khoảng cách an toàn
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<any[]>([]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const uid = auth.currentUser?.uid;
            if (!uid) return;

            const res = await axios.get(`${BACKEND_URL}/api/get-water-favorites/${uid}`);
            if (res.data.success) {
                setFavorites(res.data.data.slice(0, 4));
            }
        } catch (error) {
            console.log("Error fetching favorites:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    // --- TÍNH TOÁN CARD WIDTH ---
    // Màn hình - (Padding trái phải 20*2) - (Gap giữa 15) chia 2
    const GAP = normalize(15);
    const PADDING_H = normalize(20);
    const CARD_WIDTH = (SCREEN_WIDTH - (PADDING_H * 2) - GAP) / 2;
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Khi ấn vào icon Sync hoặc thẻ -> Mở Modal để chọn món thay thế
    const handleOpenModal = (item: any) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    // Xử lý khi ấn Lưu trong Modal -> Gọi API Update Favorite
    const handleModalSubmit = async (drink: any, volume: number) => {
        try {
            if (!editingItem) return;

            const payload = {
                uid: auth.currentUser?.uid,
                old_w_id: editingItem.W_ID, // ID món cũ đang hiển thị trên ô đó
                new_w_id: drink.W_ID,       // ID món mới vừa chọn trong Modal
                new_volume: volume          // Dung tích mới
            };
            
            // Gọi API cập nhật
            // Lưu ý: Bạn cần viết API này ở Backend Python
            await axios.post(`${BACKEND_URL}/api/update-water-favorite`, payload);
            
            fetchFavorites(); // Load lại danh sách ô ghi nhanh
        } catch (e) {
            console.log("Error updating favorite:", e);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={{padding: 5}}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thiết lập ghi nhanh</Text>
                <View style={{width: 24}} /> 
            </View>

            <View style={styles.content}>
                <Text style={styles.description} maxFontSizeMultiplier={1.3}>
                    Chọn và điều chỉnh thể tích của 4 loại đồ uống bạn thường xuyên sử dụng
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#FFC107" style={{marginTop: 50}} />
                ) : (
                    <View style={[styles.gridContainer, { gap: GAP }]}>
                        {favorites.map((item, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.card, { width: CARD_WIDTH }]}
                                onPress={() => handleOpenModal(item)}
                            >
                                <View style={styles.cardLeft}>
                                    <Image 
                                        source={getImageSource(item.IMAGE_PATH)} 
                                        style={styles.cardIcon} 
                                        resizeMode="contain" 
                                    />
                                    
                                    <View style={styles.textWrapper}>
                                        <Text 
                                            style={styles.cardName} 
                                            numberOfLines={2} 
                                            ellipsizeMode="tail"
                                            maxFontSizeMultiplier={1.2} // Giới hạn phóng to chữ
                                        >
                                            {item.drink_name}
                                        </Text>
                                        <Text 
                                            style={styles.cardVolume}
                                            maxFontSizeMultiplier={1.2}
                                        >
                                            {item.DEFAULT_VOLUME} ml
                                        </Text>
                                    </View>
                                </View>

                                {/* Icon Sync nằm bên phải */}
                                <Ionicons name="sync-outline" size={normalize(18)} color="#666" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
            <WaterSelectionModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleModalSubmit}
                defaultVolume={editingItem ? editingItem.DEFAULT_VOLUME : 200}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: normalize(15), 
        paddingVertical: normalize(15), 
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        backgroundColor: '#fff'
    },
    headerTitle: { fontSize: normalize(18), fontWeight: 'bold', color: '#333' },
    
    content: { padding: normalize(20) },
    description: { 
        fontSize: normalize(14), 
        color: '#333', 
        textAlign: 'center', 
        marginBottom: normalize(30), 
        lineHeight: normalize(22),
        fontWeight: '500'
    },

    gridContainer: {
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        // gap được xử lý inline style để đồng bộ với tính toán width
    },
    card: {
        // width được tính toán dynamic
        backgroundColor: '#E0E0E0', 
        borderRadius: 15,
        padding: normalize(10),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: normalize(80), // 👇 Dùng minHeight thay vì height cứng
    },
    cardLeft: {
        flexDirection: 'row', 
        alignItems: 'center', 
        flex: 1, // Để đẩy icon sync ra sát mép phải
        paddingRight: 5 // Tránh chữ dính vào icon sync
    },
    cardIcon: { 
        width: normalize(32), 
        height: normalize(32), 
        marginRight: normalize(8) 
    },
    textWrapper: { 
        flex: 1 // Quan trọng: Để text tự xuống dòng nếu dài quá
    },
    cardName: { 
        fontSize: normalize(13), 
        fontWeight: 'bold', 
        color: '#000',
        flexWrap: 'wrap' // Cho phép xuống dòng
    },
    cardVolume: { 
        fontSize: normalize(11), 
        color: '#555', 
        marginTop: 2 
    },
});