// app/water-reminder.tsx
import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Switch, 
    Dimensions, Platform, PixelRatio, ScrollView, Modal, FlatList 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker'; 

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

export default function WaterReminderScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    //STATE
    const [isEnabled, setIsEnabled] = useState(true);
    const [wakeUpTime, setWakeUpTime] = useState(new Date().setHours(6, 0, 0, 0)); 
    const [bedTime, setBedTime] = useState(new Date().setHours(22, 0, 0, 0));
    const [interval, setInterval] = useState(60);

    // State cho Modal chọn giờ
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timePickerMode, setTimePickerMode] = useState<'wake' | 'bed'>('wake');
    const [tempDate, setTempDate] = useState(new Date()); 

    // State cho Modal chọn chu kỳ
    const [showIntervalModal, setShowIntervalModal] = useState(false);

    // Danh sách chu kỳ
    const intervalOptions = [30, 60, 90, 120, 150, 180];

    //HÀM XỬ LÝ
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    // Format giờ hiển thị (VD: 06:00)
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Mở picker chọn giờ
    const openTimePicker = (mode: 'wake' | 'bed') => {
        setTimePickerMode(mode);
        const currentDate = mode === 'wake' ? wakeUpTime : bedTime;
        setTempDate(new Date(currentDate)); 
        setShowTimePicker(true);
    };

    // Xử lý khi chọn giờ xong
    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        
        if (selectedDate) {
            if (Platform.OS === 'android') {
                if (timePickerMode === 'wake') setWakeUpTime(selectedDate.getTime());
                else setBedTime(selectedDate.getTime());
            } else {
                setTempDate(selectedDate);
            }
        }
    };

    const confirmIOSDate = () => {
        if (timePickerMode === 'wake') setWakeUpTime(tempDate.getTime());
        else setBedTime(tempDate.getTime());
        setShowTimePicker(false);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={styles.backButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                    <Ionicons name="arrow-back" size={normalize(24)} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} maxFontSizeMultiplier={1.2}>Nhắc nhở uống nước</Text>
                <View style={{width: normalize(24)}} /> 
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    
                    {/* Row 1: Switch */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Thông báo</Text>
                        <Switch
                            trackColor={{ false: "#767577", true: "#00E676" }}
                            thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                        />
                    </View>
                    <View style={styles.divider} />

                    {/* Row 2: Giờ thức dậy */}
                    <TouchableOpacity 
                        style={styles.row} 
                        onPress={() => openTimePicker('wake')}
                        disabled={!isEnabled}
                    >
                        <Text style={[styles.label, !isEnabled && styles.disabledText]}>Giờ thức dậy</Text>
                        <View style={styles.valueContainer}>
                            <Text style={[styles.valueText, !isEnabled && styles.disabledText]}>
                                {formatTime(Number(wakeUpTime))}
                            </Text>
                            <Ionicons name="chevron-forward" size={normalize(18)} color={isEnabled ? "#999" : "#CCC"} />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    {/* Row 3: Giờ đi ngủ */}
                    <TouchableOpacity 
                        style={styles.row} 
                        onPress={() => openTimePicker('bed')}
                        disabled={!isEnabled}
                    >
                        <Text style={[styles.label, !isEnabled && styles.disabledText]}>Giờ đi ngủ</Text>
                        <View style={styles.valueContainer}>
                            <Text style={[styles.valueText, !isEnabled && styles.disabledText]}>
                                {formatTime(Number(bedTime))}
                            </Text>
                            <Ionicons name="chevron-forward" size={normalize(18)} color={isEnabled ? "#999" : "#CCC"} />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.divider} />

                    {/* Row 4: Chu kỳ */}
                    <TouchableOpacity 
                        style={[styles.row, { borderBottomWidth: 0 }]}
                        onPress={() => setShowIntervalModal(true)}
                        disabled={!isEnabled}
                    >
                        <Text style={[styles.label, !isEnabled && styles.disabledText]}>Chu kỳ nhắc nhở</Text>
                        <View style={styles.valueContainer}>
                            <Text style={[styles.valueText, !isEnabled && styles.disabledText]}>
                                {interval} phút
                            </Text>
                            <Ionicons name="chevron-forward" size={normalize(18)} color={isEnabled ? "#999" : "#CCC"} />
                        </View>
                    </TouchableOpacity>

                </View>
            </ScrollView>

            {/* --- MODAL CHỌN CHU KỲ (INTERVAL) --- */}
            <Modal
                visible={showIntervalModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowIntervalModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowIntervalModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn chu kỳ nhắc nhở</Text>
                        {intervalOptions.map((item) => (
                            <TouchableOpacity 
                                key={item} 
                                style={styles.intervalItem}
                                onPress={() => {
                                    setInterval(item);
                                    setShowIntervalModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.intervalText, 
                                    interval === item && styles.intervalTextActive
                                ]}>
                                    {item} phút
                                </Text>
                                {interval === item && (
                                    <Ionicons name="checkmark" size={20} color="#00C853" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* --- MODAL CHỌN GIỜ (TIME PICKER) --- */}
            {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={new Date(tempDate)}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                />
            )}

            {Platform.OS === 'ios' && (
                <Modal
                    visible={showTimePicker}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.iosModalOverlay}>
                        <View style={styles.iosPickerContainer}>
                            <View style={styles.iosPickerHeader}>
                                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                    <Text style={{color: '#666', fontSize: 16}}>Hủy</Text>
                                </TouchableOpacity>
                                <Text style={{fontWeight: 'bold', fontSize: 16}}>
                                    Chọn {timePickerMode === 'wake' ? 'giờ thức dậy' : 'giờ đi ngủ'}
                                </Text>
                                <TouchableOpacity onPress={confirmIOSDate}>
                                    <Text style={{color: '#007AFF', fontSize: 16, fontWeight: 'bold'}}>Xong</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={new Date(tempDate)}
                                mode="time"
                                display="spinner" 
                                onChange={handleTimeChange}
                                style={{height: 200}}
                                textColor="#000"
                            />
                        </View>
                    </View>
                </Modal>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: normalize(20), paddingVertical: normalize(15),
        backgroundColor: '#F5F7FA',
    },
    backButton: { padding: 5 },
    headerTitle: { fontSize: normalize(18), fontWeight: 'bold', color: '#333' },

    content: { padding: normalize(20) },

    card: {
        backgroundColor: '#FFF', borderRadius: 20,
        paddingHorizontal: normalize(20), paddingVertical: normalize(5),
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    },

    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: normalize(18),
    },
    divider: { height: 1, backgroundColor: '#F0F0F0', width: '100%' },

    label: { fontSize: normalize(16), color: '#333', fontWeight: '500' },
    valueContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    valueText: { fontSize: normalize(16), color: '#00C853', fontWeight: '500' },
    disabledText: { color: '#BBB' },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', alignItems: 'center'
    },
    modalContent: {
        width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20,
        elevation: 5
    },
    modalTitle: {
        fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333'
    },
    intervalItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
    },
    intervalText: { fontSize: 16, color: '#333' },
    intervalTextActive: { color: '#00C853', fontWeight: 'bold' },

    iosModalOverlay: {
        flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)'
    },
    iosPickerContainer: {
        backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingBottom: 20
    },
    iosPickerHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#F9F9F9',
        borderTopLeftRadius: 20, borderTopRightRadius: 20
    }
});