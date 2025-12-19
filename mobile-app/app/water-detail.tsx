// app/water-detail.tsx
import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, 
    Dimensions, ActivityIndicator, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { auth } from '@/src/config/firebase'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';//
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withSequence, 
    withTiming,
    Easing
} from 'react-native-reanimated';
import WaterSelectionModal from '@/src/components/WaterSelectionModal';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BACKEND_URL = 'http://192.168.1.3:8000'; 

// 1. Helper Format ngày cho API (YYYY-MM-DD)
const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0];
};

// 2. Helper Format hiển thị (DD/MM)
const formatDateForDisplay = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${d}/${m}`;
};

// 3. Helper so sánh ngày (để biết có phải hôm nay không)
const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const formatTime = (isoString: string) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getImageSource = (path: string) => {
    if (!path) return require('@/assets/images/react-logo.png');
    return path.startsWith('http') ? { uri: path } : { uri: `${BACKEND_URL}/${path}` };
};

export default function WaterDetailScreen() {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const player = useAudioPlayer(require('@/assets/sounds/water_drop.mp3'));
      const playWaterSound = () => {
        console.log("Status player:", player); 
        if (player) {
            console.log("Đang phát nhạc...");
            player.seekTo(0);
            player.play();
        } else {
            console.log("Lỗi: Player chưa sẵn sàng");
        }
    };
    const insets = useSafeAreaInsets();
    const { initialDate } = useLocalSearchParams();
    // 2. Khởi tạo state selectedDate dựa trên initialDate
    const [selectedDate, setSelectedDate] = useState(() => {
        if (initialDate) {
            return new Date(initialDate as string);
        }
        return new Date(); 
    });
    const [isToday, setIsToday] = useState(true);

    const [loading, setLoading] = useState(true);
    const TARGET = 2500;
    const [quickButtons, setQuickButtons] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [totalWater, setTotalWater] = useState(0);
    const [showAllLogs, setShowAllLogs] = useState(false);

    const handleChangeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    // Cập nhật trạng thái isToday mỗi khi selectedDate thay đổi
    useEffect(() => {
        setIsToday(isSameDay(selectedDate, new Date()));
    }, [selectedDate]);

    const fetchData = async () => {
            try {
                setLoading(true);
                const uid = auth.currentUser?.uid;
                if (!uid) return;

                const dateStr = formatDateForAPI(selectedDate);

                const [favRes, logRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/api/get-water-favorites/${uid}`),
                    axios.get(`${BACKEND_URL}/api/get-water-logs/${uid}?date_str=${dateStr}`)
                ]);

                if (favRes.data.success) setQuickButtons(favRes.data.data.slice(0, 4));
                if (logRes.data.success) {
                    const fetchedLogs = logRes.data.data;
                    setLogs(fetchedLogs);
                    const sum = fetchedLogs.reduce((acc: number, item: any) => acc + (item.VOLUME_ML || 0), 0);
                    setTotalWater(sum);
                }
            } catch (e) {
                console.log("Error:", e);
            } finally {
                setLoading(false);
            }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [selectedDate]) 
    );

    const handleQuickAdd = async (item: any) => {
        playWaterSound();
        try {
             // Khi ghi nước, luôn ghi cho ngày đang chọn (selectedDate)
             const dateStr = formatDateForAPI(selectedDate);
             const payload = {
                uid: auth.currentUser?.uid,
                w_id: item.W_ID,
                amount_ml: item.DEFAULT_VOLUME,
                date_str: dateStr
            };
            await axios.post(`${BACKEND_URL}/api/log-water`, payload);
            fetchData();
        } catch (e) {
            console.log("Error logging:", e);
        }
    };

    const percentage = Math.min((totalWater / TARGET) * 100, 100);
    const visibleLogs = showAllLogs ? logs : logs.slice(0, 3);

    // 2. Viết hàm xử lý nút Back
    const handleBack = () => {
        router.dismissAll();
        router.navigate({ 
            pathname: '/(tabs)',
            params: { 
                date: selectedDate.toISOString()
            }
        });
    };

    const animatedHeight = useSharedValue(percentage);
    const waveWobble = useSharedValue(0);

    const animatedWaterStyle = useAnimatedStyle(() => {
        return {
            height: `${animatedHeight.value}%`,
            transform: [
                { rotateZ: `${waveWobble.value}deg` }, 
                 { translateX: waveWobble.value * 1.5 } 
            ],
        };
    });
    //HÀM XÓA NƯỚC
    const handleDeleteLog = async (logId: number) => {
        try {
            // Gọi API xóa
            const res = await axios.delete(`${BACKEND_URL}/api/delete-water-log/${logId}`);
            
            if (res.data.success) {
                fetchData(); 
            } else {
                Alert.alert("Lỗi", "Không thể xóa bản ghi này.");
            }
        } catch (e) {
            console.log("Error deleting:", e);
            Alert.alert("Lỗi", "Đã xảy ra lỗi khi xóa.");
        }
    };

    const [modalVisible, setModalVisible] = useState(false);

    const handleOpenModal = () => {
        setModalVisible(true);
    };

    // Xử lý khi ấn Lưu trong Modal -> Gọi API Log Water
    const handleModalSubmit = async (selectedDrink: any, volume: number) => {
        try {
            const dateStr = formatDateForAPI(selectedDate);
            const payload = {
                uid: auth.currentUser?.uid,
                w_id: selectedDrink.W_ID,
                amount_ml: volume,
                date_str: dateStr
            };
            
            // Gọi API lưu nước
            const res = await axios.post(`${BACKEND_URL}/api/log-water`, payload);
            
            if (res.data.success) {
                playWaterSound();
                fetchData(); 
            }
        } catch (e) {
            console.log("Error logging from modal:", e);
        }
    };

    // 4. Kích hoạt hoạt ảnh mỗi khi "percentage" thay đổi
    useEffect(() => {
        animatedHeight.value = withSpring(percentage, { damping: 15, stiffness: 90 });

        if (percentage > 0) {
            waveWobble.value = withSequence(
                withTiming(3, { duration: 150, easing: Easing.ease }),
                withTiming(-2, { duration: 150, easing: Easing.ease }),
                withTiming(1, { duration: 150, easing: Easing.ease }),
                withSpring(0, { damping: 10, stiffness: 100 })
            );
        }
    }, [percentage]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.dateBadge}>
                    <TouchableOpacity 
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        onPress={() => handleChangeDate(-1)}
                    >
                        <Ionicons name="caret-back-outline" size={16} color="#333" />
                    </TouchableOpacity>

                    <Text style={styles.dateText}>
                        {isToday ? "Hôm nay" : formatDateForDisplay(selectedDate)}
                    </Text>

                    <TouchableOpacity 
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        onPress={() => handleChangeDate(1)} 
                        disabled={isToday} 
                    >
                        <Ionicons 
                            name="caret-forward-outline" 
                            size={16} 
                            color={isToday ? "#C7C7CC" : "#333"}
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    onPress={() => {
                        console.log("Mở màn hình cài đặt");
                        router.push('/settings'); 
                    }} 
                    style={styles.iconButton}
                > 
                    <Ionicons name="settings-outline" size={24} color="#FFC107" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Visual Cup */}
                <View style={styles.cupContainer}>
                   <View style={styles.cupOutline}>
                        <Animated.View 
                            style={[styles.waterLevel, animatedWaterStyle]} 
                        />
                        
                        <View style={styles.cupContent}>
                            <Text style={styles.totalText} maxFontSizeMultiplier={1.5}>
                                {Math.round(totalWater)} ml
                            </Text>
                            <Text style={styles.percentText} maxFontSizeMultiplier={1.2}>
                                Đã đạt {Math.round(percentage)}%
                            </Text>
                        </View>
                    </View>
                </View>
                
                {/* Ghi Nhanh */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Ghi nhanh</Text>
                    <TouchableOpacity 
                        style={{padding: 5}}
                        onPress={() => router.push('/water-quick-setup')}
                    >
                        <Ionicons name="pencil" size={18} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.gridContainer}>
                    {loading ? <ActivityIndicator size="small" color="#007AFF" /> : quickButtons.map((btn, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.gridItem}
                            onPress={() => handleQuickAdd(btn)}
                        >
                            <Image source={getImageSource(btn.IMAGE_PATH)} style={styles.gridIcon} resizeMode="contain" />
                            <View style={{flex: 1, paddingRight: 5}}>
                                <Text style={styles.gridName} numberOfLines={2} ellipsizeMode='tail'>
                                    {btn.drink_name}
                                </Text>
                                <Text style={styles.gridAmount}>{btn.DEFAULT_VOLUME} ml</Text>
                            </View>
                            <Ionicons name="add-circle" size={24} color="#4CAF50" />
                        </TouchableOpacity>
                    ))}
                    {quickButtons.length === 0 && !loading && (
                        <Text style={styles.emptyText}>Chưa cài đặt đồ uống yêu thích</Text>
                    )}
                </View>

                {/* Lịch Sử */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Đã uống {logs.length} lần</Text>
                    <TouchableOpacity 
                        style={{padding: 5}} 
                        onPress={() => setIsEditing(!isEditing)}
                    >
                         <Text style={{color: isEditing ? '#007AFF' : '#666', fontSize: 13, fontWeight: isEditing ? 'bold' : 'normal'}}>
                             {isEditing ? "Xong" : "Sửa"}
                         </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.historyList}>
                    {visibleLogs.map((item, index) => (
                        <View key={index} style={styles.historyItem}>
                            <View style={styles.historyLeft}>
                                {isEditing && (
                                    <TouchableOpacity 
                                        onPress={() => handleDeleteLog(item.LOG_ID)}
                                        style={{marginRight: 10}}
                                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                    >
                                        <Ionicons name="remove-circle-outline" size={24} color="#FF3B30" />
                                    </TouchableOpacity>
                                )}
                                <Image source={getImageSource(item.IMAGE_PATH)} style={styles.historyIcon} />
                                <View style={{flex: 1}}>
                                    <Text style={styles.historyName}>{item.drink_name}</Text>
                                    <Text style={styles.historyTime}>{formatTime(item.LOG_TIME)}</Text>
                                </View>
                            </View>
                            <View style={styles.historyRight}>
                                <Text style={styles.historyAmount} numberOfLines={1}>
                                    {item.VOLUME_ML} 
                                    {item.VOLUME_ML != item.ACTUAL_WATER_ML && (
                                        <Text style={{color: '#007AFF', fontSize: 13}}> ({Math.round(item.ACTUAL_WATER_ML)})</Text>
                                    )}
                                    <Text style={styles.unitText}> ml</Text>
                                </Text>
                            </View>
                        </View>
                    ))}
                    
                    {logs.length === 0 && !loading && (
                        <Text style={styles.emptyText}>Ngày này chưa uống gì cả</Text>
                    )}

                    {logs.length > 3 && (
                        <TouchableOpacity 
                            style={styles.showMore}
                            onPress={() => setShowAllLogs(!showAllLogs)}
                        >
                            <Text style={{color: '#999', marginRight: 5}}>
                                {showAllLogs ? "Thu gọn" : "Xem thêm"}
                            </Text>
                            <Ionicons name={showAllLogs ? "chevron-up" : "chevron-down"} size={16} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>

            <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={styles.btnBig} onPress={handleOpenModal}>
                    <Text style={styles.btnBigText}>Ghi đồ uống</Text>
                </TouchableOpacity>
            </View>
            <WaterSelectionModal 
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleModalSubmit}
                defaultVolume={250}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    
    header: { 
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
        paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#fff', zIndex: 10
    },
    iconButton: { padding: 5 },
    
    dateBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#FFD700', 
        paddingHorizontal: 15, 
        paddingVertical: 8, 
        borderRadius: 20,
        gap: 15 
    },
    dateText: { fontWeight: 'bold', color: '#333', fontSize: 14, minWidth: 60, textAlign: 'center' },

    scrollContent: { },
    cupContainer: { alignItems: 'center', marginVertical: 20 },
    cupOutline: {
        width: SCREEN_WIDTH * 0.4, height: (SCREEN_WIDTH * 0.4) * 1.25, 
        borderLeftWidth: 4, borderRightWidth: 4, borderBottomWidth: 4, borderColor: '#B3E5FC',
        borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
        justifyContent: 'flex-end', overflow: 'hidden', position: 'relative'
    },
    waterLevel: { backgroundColor: '#E1F5FE', width: '100%', position: 'absolute', bottom: 0 },
    cupContent: { position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    totalText: { fontSize: 28, fontWeight: 'bold', color: '#0288D1' },
    percentText: { fontSize: 13, color: '#555', marginTop: 4 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 10 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
    gridItem: { 
        width: '48%', backgroundColor: '#F8F9FA', borderRadius: 15, padding: 10, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', minHeight: 60
    },
    gridIcon: { width: 32, height: 32, marginRight: 8 },
    gridName: { fontWeight: 'bold', fontSize: 13, color: '#333', flexWrap: 'wrap' },
    gridAmount: { fontSize: 12, color: '#777', marginTop: 2 },
    historyList: { paddingHorizontal: 20, marginBottom: 20 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
    historyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
    historyIcon: { width: 30, height: 30, marginRight: 12 },
    historyName: { fontSize: 15, fontWeight: '600', color: '#333' },
    historyTime: { color: '#999', fontSize: 12, marginTop: 2 },
    historyRight: { alignItems: 'flex-end', flexShrink: 0 },
    historyAmount: { fontSize: 15, fontWeight: 'bold' },
    unitText: { color: '#333', fontWeight: 'normal', fontSize: 13 },
    emptyText: { color: '#999', fontStyle: 'italic', width: '100%', textAlign: 'center', marginTop: 10 },
    showMore: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15 },
    bottomArea: { 
        paddingHorizontal: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EEE', 
        backgroundColor: '#fff', position: 'absolute', bottom: 0, left: 0, right: 0
    },
    btnBig: { backgroundColor: '#FFD700', padding: 15, borderRadius: 12, alignItems: 'center' },
    btnBigText: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});