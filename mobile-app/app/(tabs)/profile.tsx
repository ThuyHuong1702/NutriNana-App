import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, 
    Switch, Dimensions, Platform, PixelRatio, ActivityIndicator, Alert, Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { auth } from '@/src/config/firebase'; 
import * as ImagePicker from 'expo-image-picker';
import { BACKEND_URL } from '@/src/config/apiConfig';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- SIZE NORMALIZATION FUNCTION (RESPONSIVE) ---
const scale = SCREEN_WIDTH / 375; 
const normalize = (size: number) => {
    const newSize = size * scale;
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
    }
};

// --- IMAGE SOURCE HANDLER ---
const getAvatarSource = (path: string | null | undefined) => {
    if (!path) return require('@/assets/images/react-logo.png');
    if (path.startsWith('http')) return { uri: path };
    return { uri: `${BACKEND_URL}/${path}` };
};

// --- USER INTERFACE DEFINITION ---
interface UserProfile {
    NICKNAME: string;
    IMAGE_PATH?: string;
    WEIGHT?: number;
    TARGET_WEIGHT_KG?: number;
    DAILY_WATER_L?: number;
    DAILY_CALORIE?: number;
    GOAL_TYPE?: string;
    [key: string]: any;
}

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // --- STATE ---
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
    const [showResetModal, setShowResetModal] = useState(false);

    const [healthData, setHealthData] = useState({
        weightGoal: 0,
        caloGoal: 0,
        waterGoal: 0,
        planName: 'Maintain Health'
    });

    // --- EFFECTS ---
    useEffect(() => {
        fetchUserProfile();
    }, []);

    // --- API FUNCTIONS ---
    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const uid = auth.currentUser?.uid;
            if (!uid) return;

            const res = await axios.get(`${BACKEND_URL}/api/get-profile/${uid}`);
            
            if (res.data.success) {
                const profile = res.data.data;
                setUserProfile(profile);
                calculateHealthMetrics(profile);
            }
        } catch (error) {
            console.log("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateHealthMetrics = (profile: any) => {
        const targetWeight = profile.TARGET_WEIGHT_KG || (profile.WEIGHT ? profile.WEIGHT - 2 : 60);
        const waterTarget = profile.DAILY_WATER_L ? Math.round(profile.DAILY_WATER_L * 1000) : 2000;
        const caloTarget = profile.DAILY_CALORIE || 2000;

        let plan = "Maintain Health";
        if (profile.GOAL_TYPE === 'lose') plan = "Giảm cân";
        if (profile.GOAL_TYPE === 'gain') plan = "Tăng cân";
        if (profile.GOAL_TYPE === 'maintain') plan = "Duy trì cân nặng";

        setHealthData({
            weightGoal: targetWeight,
            caloGoal: caloTarget,
            waterGoal: waterTarget,
            planName: plan
        });
    };

    // --- IMAGE PICKER & UPLOAD ---
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Library access is needed to change avatar!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            uploadAvatar(result.assets[0]);
        }
    };

    const uploadAvatar = async (imageAsset: any) => {
        try {
            setUploading(true); 
            
            const uid = auth.currentUser?.uid;
            if (!uid) return;

            const formData = new FormData();
            formData.append('uid', uid);
            
            const localUri = imageAsset.uri;
            const filename = localUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            // @ts-ignore
            formData.append('file', { uri: localUri, name: filename, type });

            const res = await axios.post(`${BACKEND_URL}/api/upload-avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                setUserProfile((prev) => {
                    if (!prev) return null;
                    return { ...prev, IMAGE_PATH: res.data.data.image_path };
                });
                Alert.alert("Success", "Tải ảnh đại diện thành công!");
            }
        } catch (error) {
            console.log("Upload error:", error);
            Alert.alert("Error", "Could not upload image.");
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmReset = async () => {
        try {
            setShowResetModal(false); 
            setLoading(true); 

            const uid = auth.currentUser?.uid;
            if (!uid) return;

            const res = await axios.delete(`${BACKEND_URL}/api/reset-user-progress/${uid}`);

            if (res.data.success) {
                console.log("Đã reset xong, chuyển hướng...");
                Alert.alert("Thông báo", "Đã xóa dữ liệu thành công. Vui lòng thiết lập lại mục tiêu.", [
                    { text: "OK", onPress: () => router.replace('/character') } 
                ]);
            } else {
                Alert.alert("Lỗi", "Không thể xóa dữ liệu.");
            }
        } catch (error) {
            console.log("Reset error:", error);
            Alert.alert("Lỗi", "Có lỗi xảy ra khi kết nối server.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFC107" />
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={[
                styles.contentContainer, 
                { paddingTop: insets.top + 20, paddingBottom: 100 }
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* --- HEADER PROFILE --- */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={pickImage} 
                    style={styles.avatarContainer}
                    disabled={uploading}
                >
                    <Image 
                        source={getAvatarSource(userProfile?.IMAGE_PATH)} 
                        style={[styles.avatar, uploading && { opacity: 0.5 }]} 
                        resizeMode="cover"
                    />
                    {uploading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="small" color="#333" />
                        </View>
                    )}
                    {!uploading && (
                        <View style={styles.cameraIconBadge}>
                            <Ionicons name="camera" size={12} color="#FFF" />
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.userInfo}>
                    <Text 
                        style={styles.userName} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit 
                        maxFontSizeMultiplier={1.3}
                    >
                        {userProfile?.NICKNAME || "New User"}
                    </Text>
                    <Ionicons name="ribbon" size={normalize(24)} color="#FFC107" style={styles.badgeIcon} />
                </View>
            </View>

            {/* --- PLAN SECTION --- */}
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Kế hoạch</Text>
            <View style={styles.card}>
                <View style={styles.rowItem}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={normalize(24)} color="#4CAF50" />
                    <View style={styles.textWrapper}>
                        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.2}>{healthData.planName}</Text>
                    </View>
                </View>
            </View>

            {/* --- HEALTH DATA SECTION --- */}
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Dữ liệu sức khỏe</Text>
            <View style={styles.card}>
                <View style={styles.rowItem}>
                    <Ionicons name="checkmark-circle" size={normalize(20)} color="#4CAF50" />
                    <View style={styles.textWrapper}>
                        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.2}>Cân nặng mục tiêu</Text>
                    </View>
                    <Text style={styles.rowValue} maxFontSizeMultiplier={1.2}>{healthData.weightGoal} kg</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.rowItem}>
                    <Ionicons name="flame" size={normalize(20)} color="#FF5722" />
                    <View style={styles.textWrapper}>
                        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.2}>Calo mục tiêu</Text>
                    </View>
                    <Text style={styles.rowValue} maxFontSizeMultiplier={1.2}>{healthData.caloGoal} kcal</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.rowItem}>
                    <Ionicons name="water" size={normalize(20)} color="#29B6F6" />
                    <View style={styles.textWrapper}>
                        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.2}>Lượng nước mục tiêu</Text>
                    </View>
                    <Text style={styles.rowValue} maxFontSizeMultiplier={1.2}>{healthData.waterGoal} ml</Text>
                </View>
            </View>

            {/* --- APP SETTINGS SECTION --- */}
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Cài đặt ứng dụng</Text>
            <View style={styles.card}>
                <TouchableOpacity style={styles.rowItem} onPress={() => setShowResetModal(true)}>
                    <Ionicons name="refresh" size={normalize(20)} color="#666" />
                    <View style={styles.textWrapper}>
                        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.2}>Bắt đầu lại</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={normalize(16)} color="#999" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.rowItem}>
                    <Ionicons name="notifications" size={normalize(20)} color="#666" />
                    <View style={styles.textWrapper}>
                        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.2}>Thông báo</Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: "#4CAF50" }}
                        thumbColor={isNotificationEnabled ? "#fff" : "#f4f3f4"}
                        onValueChange={() => setIsNotificationEnabled(!isNotificationEnabled)}
                        value={isNotificationEnabled}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} 
                    />
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.rowItem} onPress={() => router.push('/language')}>
                    <Ionicons name="globe-outline" size={normalize(20)} color="#666" />
                    <View style={styles.textWrapper}>
                        <Text style={styles.rowLabel} maxFontSizeMultiplier={1.2}>Ngôn ngữ</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={normalize(16)} color="#999" />
                </TouchableOpacity>
            </View>

             {/* --- PREMIUM SECTION --- */}
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Subscription</Text>
            <View style={styles.card}>
                <TouchableOpacity style={styles.rowItem} onPress={() => router.push('/premium')}>
                    <MaterialCommunityIcons name="crown" size={normalize(24)} color="#333" />
                    <View style={styles.textWrapper}>
                        <Text 
                            style={[styles.rowLabel, {fontWeight: 'bold', color: '#333'}]}
                            maxFontSizeMultiplier={1.2}
                        >
                            Lấy Premium
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
            <Modal
                transparent={true}
                visible={showResetModal}
                animationType="fade"
                onRequestClose={() => setShowResetModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Bắt đầu lại?</Text>
                        <Text style={styles.modalDesc}>
                            Điều này sẽ đặt lại tiến trình của bạn và cho phép bạn tính toán lại mục tiêu calo của mình, bạn có chắc muốn tiếp tục?
                        </Text>
                        
                        <View style={styles.modalButtons}>
                            {/* Nút Hủy bỏ */}
                            <TouchableOpacity 
                                style={styles.modalBtnCancel} 
                                onPress={() => setShowResetModal(false)}
                            >
                                <Text style={styles.btnTextCancel}>Hủy bỏ</Text>
                            </TouchableOpacity>

                            {/* Nút Tiếp tục */}
                            <TouchableOpacity 
                                style={styles.modalBtnConfirm} 
                                onPress={handleConfirmReset}
                            >
                                <Text style={styles.btnTextConfirm}>Tiếp tục</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    contentContainer: { paddingHorizontal: normalize(20) },
    
    // Header
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: normalize(20) },
    avatarContainer: {
        width: normalize(60), height: normalize(60),
        borderRadius: normalize(30), backgroundColor: '#FFF9C4', 
        justifyContent: 'center', alignItems: 'center', marginRight: 15,
        position: 'relative', overflow: 'hidden'
    },
    avatar: { width: normalize(50), height: normalize(50), borderRadius: normalize(25) },
    
    // Loading Overlay
    loadingOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: normalize(30)
    },
    cameraIconBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#FFC107', width: 20, height: 20, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF'
    },

    userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    userName: { 
        fontSize: normalize(20), 
        fontWeight: 'bold', 
        color: '#333', 
        flex: 1, 
        marginRight: 10 
    },
    badgeIcon: { flexShrink: 0 },

    // Section Title
    sectionTitle: {
        fontSize: normalize(16), fontWeight: 'bold', color: '#333',
        marginTop: normalize(15), marginBottom: normalize(10)
    },

    // Card Style
    card: {
        backgroundColor: '#FFFDE7', borderRadius: 15,
        paddingHorizontal: normalize(15), paddingVertical: normalize(5)
    },

    // Row Item
    rowItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: normalize(12), minHeight: normalize(50) 
    },
    
    // Text Wrapper: Fixes layout breaking on large fonts/screens
    textWrapper: { 
        flex: 1, 
        marginLeft: 10, 
        marginRight: 10, 
        justifyContent: 'center' 
    },
    rowLabel: { fontSize: normalize(15), color: '#333' },
    rowValue: { fontSize: normalize(15), color: '#333', fontWeight: 'bold', textAlign: 'right' },
    
    divider: { height: 1, backgroundColor: '#F0F0F0', width: '100%', marginLeft: 30 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5
    },
    modalTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10
    },
    modalDesc: {
        fontSize: normalize(14),
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between'
    },
    modalBtnCancel: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center'
    },
    modalBtnConfirm: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center'
    },
    btnTextCancel: {
        fontSize: normalize(16),
        color: '#999',
        fontWeight: '500'
    },
    btnTextConfirm: {
        fontSize: normalize(16),
        color: '#CDBE78', 
        fontWeight: 'bold'
    }
});