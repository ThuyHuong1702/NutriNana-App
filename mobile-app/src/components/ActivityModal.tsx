//src/components/ActivityModal.tsx
import React, { useState, useEffect } from 'react';
import { 
    View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, Image, 
    Keyboard, TouchableWithoutFeedback, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { auth } from '@/src/config/firebase';

interface Props {
    visible: boolean;
    item: any;
    onClose: () => void;
    backendUrl: string;
    userWeight?: number; // Cân nặng user để tính calo
    onSaveSuccess?: () => void; // Callback reload list sau khi save
    onFavoriteToggled?: () => void;
    targetDate?: string;
}

export default function ActivityModal({ visible, item, onClose, backendUrl, userWeight = 60, onSaveSuccess, onFavoriteToggled, targetDate }: Props) {
    const [minutes, setMinutes] = useState(''); 
    const [manualCal, setManualCal] = useState('');
    
    // State quản lý levels từ API
    const [levels, setLevels] = useState<any[]>([]); 
    const [selectedLevel, setSelectedLevel] = useState<any>(null);
    const [showIntensityDropdown, setShowIntensityDropdown] = useState(false);
    
    // Tim yêu thích
    const [isFavorite, setIsFavorite] = useState(false);
    const [saving, setSaving] = useState(false);

    // Reset dữ liệu khi mở modal
    useEffect(() => {
        if (visible && item) {
            setMinutes('');
            setManualCal('');
            setShowIntensityDropdown(false);
            setIsFavorite(item.is_favorite || false); // Set tim từ dữ liệu API

            // Lấy danh sách levels từ item API trả về
            const dbLevels = item.levels || [];
            if (dbLevels.length > 0) {
                setLevels(dbLevels);
                setSelectedLevel(dbLevels[0]); // Mặc định chọn cái đầu
            } else {
                setLevels([]);
                setSelectedLevel(null);
            }
        }
    }, [visible, item]);

    if (!item) return null;

    // --- LOGIC TÍNH CALO ---
    const calculateCalories = () => {
        if (manualCal !== '') return parseFloat(manualCal) || 0;
        
        const duration = parseInt(minutes) || 0;
        const met = selectedLevel ? selectedLevel.met_value : 0;
        
        // Công thức: (MET * 3.5 * weight) / 200 * minutes
        const caloriesBurned = (met * 3.5 * userWeight) / 200 * duration;
        return Math.round(caloriesBurned);
    };

    const totalCal = calculateCalories();

    // --- XỬ LÝ LƯU (SAVE) ---
    const handleSave = async () => {
        if (!auth.currentUser || !selectedLevel) return;
        setSaving(true);
        try {
            const payload = {
                firebase_id: auth.currentUser.uid,
                level_id: selectedLevel.level_id, // Lấy ID từ level đã chọn
                duration_minutes: parseInt(minutes) || 0,
                calories_burned: totalCal,
                log_date: targetDate || new Date().toISOString().split('T')[0]
            };

            const res = await axios.post(`${backendUrl}/api/log-activity`, payload);
            
            if (res.data.success) {
                Alert.alert("Thành công", `Đã lưu hoạt động: ${item.name}`);
                if (onSaveSuccess) onSaveSuccess(); // Reload list bên ngoài nếu cần
                onClose();
            } else {
                Alert.alert("Lỗi", "Không thể lưu hoạt động");
            }
        } catch (error) {
            console.log(error);
            Alert.alert("Lỗi", "Kết nối server thất bại");
        } finally {
            setSaving(false);
        }
    };

    // --- XỬ LÝ TIM (FAVORITE) ---
    const toggleFavorite = async () => {
        if (!auth.currentUser) return;
        // UI Optimistic Update: Đổi màu ngay lập tức cho mượt
        const newState = !isFavorite;
        setIsFavorite(newState); 

        try {
            await axios.post(`${backendUrl}/api/toggle-favorite-activity`, {
                firebase_id: auth.currentUser.uid,
                activity_id: item.id
            });
            // Nếu cần thiết thì gọi lại API list ở màn cha để cập nhật
        } catch (error) {
            console.log("Fav Error:", error);
            setIsFavorite(!newState); // Revert nếu lỗi
        }
    };

    // Xử lý ảnh
    let imageSource = require('@/assets/images/react-logo.png');
    const imgPath = item.image_url || item.IMAGE_PATH;
    if (imgPath) {
        imageSource = imgPath.startsWith('http') ? { uri: imgPath } : { uri: `${backendUrl}/${imgPath}` };
    }

    // Điều kiện enable nút Save: Phải chọn Level VÀ (Có nhập phút HOẶC Nhập calo tay)
    const canSave = selectedLevel && (minutes.length > 0 || manualCal.length > 0);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Chi tiết vận động</Text>
                        <View style={{width: 24}} /> 
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Info Card */}
                        <View style={styles.infoCard}>
                            <Image source={imageSource} style={styles.infoImage} resizeMode="cover" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.activityName}>{item.name}</Text>
                                <Text style={styles.burnedCalText}>
                                    Đã đốt <Text style={{fontWeight: 'bold', color: '#4CAF50'}}>{totalCal}</Text> Calo
                                </Text>
                            </View>
                            
                            {/* Nút Tim */}
                            <TouchableOpacity onPress={toggleFavorite}>
                                <Ionicons 
                                    name={isFavorite ? "heart" : "heart-outline"} 
                                    size={28} 
                                    color={isFavorite ? "#E53935" : "#666"} 
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Chọn mức độ (Lấy từ DB) */}
                        <Text style={styles.sectionLabel}>Chọn mức độ vận động</Text>
                        <TouchableOpacity 
                            style={styles.dropdown} 
                            onPress={() => setShowIntensityDropdown(!showIntensityDropdown)}
                        >
                            <Text style={styles.dropdownText}>
                                {selectedLevel ? selectedLevel.level_name : 'Chọn mức độ'}
                            </Text>
                            <Ionicons name={showIntensityDropdown ? "caret-up" : "caret-down"} size={16} color="#666" />
                        </TouchableOpacity>

                        {showIntensityDropdown && (
                            <View style={styles.dropdownList}>
                                {levels.map((level: any, index: number) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        style={styles.dropdownItem}
                                        onPress={() => { setSelectedLevel(level); setShowIntensityDropdown(false); }}
                                    >
                                        <Text style={{color: selectedLevel?.level_name === level.level_name ? '#FDD835' : '#333'}}>
                                            {level.level_name}
                                        </Text>
                                        {selectedLevel?.level_name === level.level_name && <Ionicons name="checkmark" size={16} color="#FDD835"/>}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Nhập thời gian */}
                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Thời gian, phút</Text>
                            <TextInput 
                                style={styles.inputBox}
                                placeholder="0"
                                keyboardType="numeric"
                                value={minutes}
                                onChangeText={(text) => { setMinutes(text); setManualCal(''); }}
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Nhập trực tiếp */}
                        <View style={styles.inputRow}>
                            <Text style={[styles.inputLabel, {color: '#999'}]}>*Hoặc ghi trực tiếp</Text>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <TextInput 
                                    style={styles.inputDirect}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={manualCal}
                                    onChangeText={(text) => { setManualCal(text); setMinutes(''); }}
                                />
                                <Text style={styles.unitText}>Calo</Text>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity 
                            style={[styles.saveBtn, !canSave && styles.disabledBtn]} 
                            onPress={handleSave}
                            disabled={!canSave || saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveBtnText}>LƯU</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

// Giữ nguyên phần styles như cũ, chỉ thay đổi logic bên trong
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', justifyContent: 'space-between', marginTop: 10 },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { padding: 20 },
    infoCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    infoImage: { width: 60, height: 60, borderRadius: 10, marginRight: 15, backgroundColor: '#EEE' },
    infoTextContainer: { flex: 1 },
    activityName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    burnedCalText: { fontSize: 14, color: '#666' },
    sectionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
    dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 5, borderWidth: 1, borderColor: '#EEE' },
    dropdownText: { fontSize: 16, color: '#333' },
    dropdownList: { backgroundColor: '#FFF', borderRadius: 12, padding: 10, marginBottom: 20, elevation: 3 },
    dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
    inputLabel: { fontSize: 16, color: '#333' },
    inputBox: { backgroundColor: '#FFF', width: 100, height: 50, borderRadius: 12, textAlign: 'center', fontSize: 18, color: '#333', borderWidth: 1, borderColor: '#EEE' },
    inputDirect: { fontSize: 16, color: '#333', textAlign: 'right', minWidth: 50, marginRight: 5 },
    unitText: { fontSize: 16, color: '#666' },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 5 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 15, borderTopWidth: 1, borderTopColor: '#EEE' },
    saveBtn: { backgroundColor: '#333', paddingVertical: 15, borderRadius: 25, alignItems: 'center' },
    disabledBtn: { backgroundColor: '#E0E0E0' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }
});