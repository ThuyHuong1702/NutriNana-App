// src/components/WaterSelectionModal.tsx
import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, Image, 
    FlatList, Dimensions, ActivityIndicator, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 👇 Thay bằng IP máy của bạn
const BACKEND_URL = 'http://192.168.1.3:8000'; 
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Hàm xử lý ảnh
const getImageSource = (path: string) => {
    if (!path) return require('@/assets/images/react-logo.png');
    return path.startsWith('http') ? { uri: path } : { uri: `${BACKEND_URL}/${path}` };
};

// 👇 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (INTERFACE)
interface WaterSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    // Chấp nhận hàm trả về void hoặc Promise<void> để tương thích với async function
    onSubmit: (selectedDrink: any, volume: number) => void | Promise<void>; 
    defaultVolume?: number; 
}

// 👇 2. GÁN KIỂU DỮ LIỆU VÀO ĐÂY (: WaterSelectionModalProps)
export default function WaterSelectionModal({ 
    visible, 
    onClose, 
    onSubmit, 
    defaultVolume = 250 
}: WaterSelectionModalProps) { 

    const insets = useSafeAreaInsets();
    
    const [drinks, setDrinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedDrink, setSelectedDrink] = useState<any>(null);
    const [volumeStr, setVolumeStr] = useState(defaultVolume.toString());

    // Cập nhật volumeStr khi defaultVolume thay đổi hoặc modal mở lại
    useEffect(() => {
        if (visible) {
            fetchDrinks();
            setVolumeStr(defaultVolume ? defaultVolume.toString() : '250');
        }
    }, [visible, defaultVolume]);

    const fetchDrinks = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/api/get-all-water-types`);
            if (res.data.success) {
                const data = res.data.data;
                setDrinks(data);
                if (data.length > 0 && !selectedDrink) {
                    setSelectedDrink(data[0]);
                }
            }
        } catch (e) {
            console.log("Error loading drinks:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleNumPress = (num: string) => {
        if (volumeStr === '0') setVolumeStr(num);
        else if (volumeStr.length < 4) setVolumeStr(prev => prev + num);
    };

    const handleBackspace = () => {
        setVolumeStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };

    const handleSubmit = () => {
        if (selectedDrink && parseInt(volumeStr) > 0) {
            onSubmit(selectedDrink, parseInt(volumeStr));
            onClose();
        }
    };

    const renderDrinkItem = ({ item }: { item: any }) => {
        const isSelected = selectedDrink && selectedDrink.W_ID === item.W_ID;
        return (
            <TouchableOpacity 
                style={[styles.drinkItem, isSelected && styles.drinkItemActive]}
                onPress={() => setSelectedDrink(item)}
            >
                <Image source={getImageSource(item.IMAGE_PATH)} style={styles.drinkIcon} resizeMode="contain" />
                <Text 
                    style={[styles.drinkName, isSelected && styles.drinkNameActive]} 
                    numberOfLines={2} 
                    maxFontSizeMultiplier={1.2}
                >
                    {item.W_NAME} 
                </Text>
            </TouchableOpacity>
        );
    };

    const NUMPAD_HEIGHT = SCREEN_HEIGHT < 700 ? 50 : 60;

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle} maxFontSizeMultiplier={1.3}>Ghi đồ uống</Text>
                        <View style={{width: 24}} />
                    </View>

                    {/* Danh sách loại nước */}
                    <View style={styles.listWrapper}>
                        <Text style={styles.subTitle} maxFontSizeMultiplier={1.2}>Danh sách đồ uống</Text>
                        {loading ? <ActivityIndicator size="large" color="#007AFF" /> : (
                            <FlatList
                                data={drinks}
                                renderItem={renderDrinkItem}
                                keyExtractor={(item) => item.W_ID.toString()}
                                numColumns={2} 
                                columnWrapperStyle={{ gap: 10 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 10 }} 
                            />
                        )}
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Phần nhập liệu */}
                    <View style={styles.inputSection}>
                        
                        {/* Hiển thị số ml */}
                        <View style={styles.inputDisplay}>
                            <Text style={styles.volumeText} maxFontSizeMultiplier={1.2}>{volumeStr}</Text>
                            <Text style={styles.unitText} maxFontSizeMultiplier={1.2}>ml</Text>
                            <View style={styles.underline} />
                        </View>

                        {/* Chọn nhanh (Scroll ngang) */}
                        <View style={styles.chipSection}>
                            <Text style={styles.chipLabel} maxFontSizeMultiplier={1.2}>Chọn nhanh (ml)</Text>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.chipScrollContent}
                            >
                                {[100, 200, 250, 300, 350, 400, 450, 500].map(val => (
                                    <TouchableOpacity 
                                        key={val} 
                                        onPress={() => setVolumeStr(val.toString())} 
                                        style={styles.chip}
                                    >
                                        <Text style={styles.chipText} maxFontSizeMultiplier={1.2}>{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Bàn phím số */}
                        <View style={styles.numpadContainer}>
                            {/* Cột trái: Số */}
                            <View style={styles.numpadGrid}>
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((num) => (
                                    <TouchableOpacity 
                                        key={num} 
                                        style={[styles.numKey, { height: NUMPAD_HEIGHT }]} 
                                        onPress={() => num === '.' ? null : handleNumPress(num)}
                                    >
                                        <Text style={styles.numText} maxFontSizeMultiplier={1.3}>
                                            {num === '.' ? '' : num}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity 
                                    style={[styles.numKey, { height: NUMPAD_HEIGHT }]} 
                                    onPress={() => handleNumPress('00')}
                                >
                                    <Text style={styles.numText} maxFontSizeMultiplier={1.3}>00</Text>
                                </TouchableOpacity>
                            </View>
                            
                            {/* Cột phải: Xóa & Lưu */}
                            <View style={styles.submitContainer}>
                                <TouchableOpacity 
                                    style={[styles.backspaceBtn, { height: NUMPAD_HEIGHT }]} 
                                    onPress={handleBackspace}
                                >
                                    <Ionicons name="backspace-outline" size={28} color="#333" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                                    <Text style={styles.saveBtnText} maxFontSizeMultiplier={1.3}>Lưu</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { 
        backgroundColor: '#fff', 
        borderTopLeftRadius: 25, 
        borderTopRightRadius: 25, 
        height: '90%', 
        paddingHorizontal: 20,
        paddingTop: 20
    },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    subTitle: { fontWeight: 'bold', marginBottom: 8, fontSize: 15, color: '#666' },

    listWrapper: { flex: 1, minHeight: 150 }, 
    
    drinkItem: { 
        flex: 1, 
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12, padding: 8, marginBottom: 10,
        borderWidth: 1, borderColor: '#F0F0F0',
        height: 60,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2
    },
    drinkItemActive: { backgroundColor: '#E3F2FD', borderColor: '#2196F3', borderWidth: 1.5 },
    drinkIcon: { width: 32, height: 32, marginRight: 8 },
    drinkName: { fontSize: 13, color: '#333', fontWeight: '500', flex: 1 },
    drinkNameActive: { color: '#007AFF', fontWeight: 'bold' },

    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },

    inputSection: { paddingBottom: 10 },

    inputDisplay: { alignItems: 'center', marginVertical: 5, position: 'relative' },
    volumeText: { fontSize: 40, fontWeight: 'bold', color: '#333' },
    unitText: { fontSize: 16, color: '#4CAF50', position: 'absolute', right: '30%', bottom: 12 },
    underline: { width: 80, height: 4, backgroundColor: '#4CAF50', borderRadius: 2 },

    chipSection: { marginBottom: 15, marginTop: 5 },
    chipLabel: { fontSize: 14, color: '#666', marginBottom: 8, marginLeft: 5, fontWeight: '500' },
    chipScrollContent: { paddingHorizontal: 0, gap: 10 },
    chip: { 
        paddingVertical: 8, paddingHorizontal: 16, 
        backgroundColor: '#F5F5F5', borderRadius: 20, 
        borderWidth: 1, borderColor: '#EEE' 
    },
    chipText: { color: '#333', fontWeight: '600', fontSize: 14 },

    numpadContainer: { flexDirection: 'row', gap: 10 },
    numpadGrid: { flex: 3, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    numKey: { 
        width: '31%', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        backgroundColor: '#FAFAFA', borderRadius: 10
    },
    numText: { fontSize: 24, fontWeight: '500', color: '#333' },
    
    submitContainer: { flex: 1, flexDirection: 'column' },
    backspaceBtn: { 
        width: '100%', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: '#FAFAFA', borderRadius: 10, marginBottom: 8 
    },
    saveBtn: { 
        flex: 1, backgroundColor: '#4CAF50', borderRadius: 15, 
        alignItems: 'center', justifyContent: 'center', marginBottom: 8 
    },
    saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});