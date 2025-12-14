//app/water-info.tsx
import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, FlatList, 
    Image, Dimensions, Platform, PixelRatio, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

const BACKEND_URL = 'http://192.168.1.3:8000'; 
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function WaterInfoScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWaterTypes();
    }, []);

    const fetchWaterTypes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/api/get-all-water-types`);
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.log("Error fetching water info:", error);
        } finally {
            setLoading(false);
        }
    };

    // Header của danh sách (Đoạn văn mô tả)
    const ListHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.description} maxFontSizeMultiplier={1.3}>
                Mỗi loại đồ uống sẽ chứa tỉ lệ nước hàm lượng nước khác nhau, tuỳ thuộc vào các thành phần có trong đồ uống.
                Danh mục dưới đây gồm các món đồ uống phổ biến cho người Việt, với tỉ lệ nước đã được xác định sẽ giúp bạn đạt mục tiêu uống nước chính xác và dễ dàng hơn mỗi ngày.
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.itemContainer}>
            <View style={styles.leftContent}>
                <Image 
                    source={getImageSource(item.IMAGE_PATH)} 
                    style={styles.icon} 
                    resizeMode="contain" 
                />
                <View style={styles.textWrapper}>
                    <Text 
                        style={styles.itemName} 
                        maxFontSizeMultiplier={1.2}
                    >
                        {item.W_NAME}
                    </Text>
                </View>
            </View>
            
            <Text 
                style={styles.percentage} 
                maxFontSizeMultiplier={1.2}
            >
                {item.TRUE_WATER}%
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header Cố Định */}
            <View style={styles.navBar}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={styles.backButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                    <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                </TouchableOpacity>
                <Text style={styles.navTitle} maxFontSizeMultiplier={1.2}>Dữ liệu đồ uống</Text>
                <View style={{width: normalize(24)}} /> 
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 50}} />
            ) : (
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.W_ID.toString()}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: Math.max(insets.bottom, 20) }
                    ]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    
    // Navbar (Thanh tiêu đề)
    navBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: normalize(20), paddingVertical: normalize(15),
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        backgroundColor: '#fff',
        minHeight: normalize(60)
    },
    backButton: { padding: 5 },
    navTitle: { fontSize: normalize(18), fontWeight: 'bold', color: '#333' },

    // Content List
    listContent: {
        paddingHorizontal: normalize(20),
        paddingBottom: normalize(20)
    },

    // Description Header
    headerContainer: {
        paddingVertical: normalize(20),
        marginBottom: normalize(10)
    },
    description: {
        fontSize: normalize(14),
        color: '#666',
        lineHeight: normalize(22),
        textAlign: 'justify'
    },

    // Item List
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: normalize(15),
        minHeight: normalize(60) 
    },
    
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10
    },

    icon: {
        width: normalize(32),
        height: normalize(32),
        marginRight: normalize(15)
    },

    textWrapper: {
        flex: 1,
    },

    itemName: {
        fontSize: normalize(16),
        color: '#333',
        fontWeight: '500',
        flexWrap: 'wrap'
    },

    percentage: {
        fontSize: normalize(16),
        color: '#444', 
        fontWeight: '600',
        flexShrink: 0,
        width: normalize(50),
        textAlign: 'right'
    }
});