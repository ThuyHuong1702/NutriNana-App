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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WaterSelectionModal from '@/src/components/WaterSelectionModal';
import { BACKEND_URL } from '@/src/config/apiConfig';
const { width: SCREEN_WIDTH } = Dimensions.get('window');


//HÀM CHUẨN HÓA KÍCH THƯỚC
const scale = SCREEN_WIDTH / 375; 
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
    const insets = useSafeAreaInsets(); 
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

    const GAP = normalize(15);
    const PADDING_H = normalize(20);
    const CARD_WIDTH = (SCREEN_WIDTH - (PADDING_H * 2) - GAP) / 2;
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const handleOpenModal = (item: any) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    const handleModalSubmit = async (drink: any, volume: number) => {
        try {
            if (!editingItem) return;

            const payload = {
                uid: auth.currentUser?.uid,
                old_w_id: editingItem.W_ID, 
                new_w_id: drink.W_ID,   
                new_volume: volume         
            };

            await axios.post(`${BACKEND_URL}/api/update-water-favorite`, payload);
            
            fetchFavorites();
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
                                            maxFontSizeMultiplier={1.2}
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
    },
    card: {
        backgroundColor: '#E0E0E0', 
        borderRadius: 15,
        padding: normalize(10),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: normalize(80),
    },
    cardLeft: {
        flexDirection: 'row', 
        alignItems: 'center', 
        flex: 1, 
        paddingRight: 5 
    },
    cardIcon: { 
        width: normalize(32), 
        height: normalize(32), 
        marginRight: normalize(8) 
    },
    textWrapper: { 
        flex: 1 
    },
    cardName: { 
        fontSize: normalize(13), 
        fontWeight: 'bold', 
        color: '#000',
        flexWrap: 'wrap' 
    },
    cardVolume: { 
        fontSize: normalize(11), 
        color: '#555', 
        marginTop: 2 
    },
});