import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Image, TouchableOpacity, Switch, 
    Dimensions, Platform, PixelRatio, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function PremiumScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    // State quản lý gói đang chọn
    const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
    const [isTrial, setIsTrial] = useState(false); 

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={[
                    styles.scrollContent, 
                    { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }
                ]} 
                showsVerticalScrollIndicator={false}
            >
                {/* Header: Nút đóng */}
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={() => router.back()}
                        hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                    >
                        <Ionicons name="close" size={normalize(28)} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image 
                        source={require('@/assets/images/auth_logo.jpg')} 
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName} maxFontSizeMultiplier={1.5}>
                        Nutri<Text style={{color: '#FDD835'}}>Nana</Text>
                    </Text>
                </View>

                {/* Switch Dùng thử */}
                <View style={styles.trialContainer}>
                    <View style={styles.trialTextWrapper}>
                        <Text style={styles.trialText} maxFontSizeMultiplier={1.2}>
                            Vẫn có nghi ngờ? Hãy thử miễn phí
                        </Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#ccc", true: "#4CAF50" }} 
                        thumbColor={isTrial ? "#fff" : "#f4f3f4"}
                        onValueChange={() => setIsTrial(!isTrial)}
                        value={isTrial}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                </View>

                {/* --- GÓI HÀNG NĂM --- */}
                <TouchableOpacity 
                    // Logic style: Nếu chọn 'yearly' -> dùng style Selected, ngược lại dùng Normal
                    style={[
                        styles.planCard, 
                        selectedPlan === 'yearly' ? styles.planCardSelected : styles.planCardNormal
                    ]}
                    onPress={() => setSelectedPlan('yearly')}
                    activeOpacity={0.9}
                >
                    {/* Badge giảm giá (Luôn hiện ở gói năm) */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText} maxFontSizeMultiplier={1.2}>Bán 77%</Text>
                    </View>

                    <View style={styles.planContent}>
                        <View style={styles.planInfo}>
                            <Text 
                                style={[styles.planTitle, selectedPlan !== 'yearly' && {color: '#666'}]} 
                                maxFontSizeMultiplier={1.3}
                            >
                                Hàng năm
                            </Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text 
                                style={[styles.priceMain, selectedPlan !== 'yearly' && {color: '#666'}]} 
                                maxFontSizeMultiplier={1.2}
                            >
                                329.000 đ
                            </Text>
                            <Text style={styles.priceSub} maxFontSizeMultiplier={1.2}>
                                (24.417 đ / tháng)
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* --- GÓI HÀNG THÁNG --- */}
                <TouchableOpacity 
                    // Logic style: Nếu chọn 'monthly' -> dùng style Selected, ngược lại dùng Normal
                    style={[
                        styles.planCard, 
                        selectedPlan === 'monthly' ? styles.planCardSelected : styles.planCardNormal
                    ]}
                    onPress={() => setSelectedPlan('monthly')}
                    activeOpacity={0.9}
                >
                    <View style={styles.planContent}>
                        <View style={styles.planInfo}>
                            <Text 
                                style={[styles.planTitle, selectedPlan !== 'monthly' && {color: '#666'}]} 
                                maxFontSizeMultiplier={1.3}
                            >
                                Hàng tháng
                            </Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text 
                                style={[styles.priceMain, selectedPlan !== 'monthly' && {color: '#666'}]} 
                                maxFontSizeMultiplier={1.2}
                            >
                                132.000 đ
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <Text style={styles.disclaimer} maxFontSizeMultiplier={1.2}>
                    Bạn có thể hủy đăng ký bất cứ lúc nào
                </Text>

                <View style={{ flex: 1 }} /> 

                {/* Nút Tiếp theo */}
                <TouchableOpacity 
                    style={styles.ctaButton} 
                    onPress={() => alert(`Đã chọn gói: ${selectedPlan === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}`)}
                >
                    <Text style={styles.ctaText} maxFontSizeMultiplier={1.3}>Tiếp theo</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    
    scrollContent: {
        flexGrow: 1, 
        paddingHorizontal: normalize(20),
        alignItems: 'center',
    },

    headerRow: { width: '100%', alignItems: 'flex-end', marginBottom: normalize(10) },
    closeButton: { padding: 5 },

    logoContainer: { alignItems: 'center', marginBottom: normalize(30), marginTop: normalize(10) },
    logo: { width: normalize(100), height: normalize(100), marginBottom: 10 },
    appName: { fontSize: normalize(28), fontWeight: '900', color: '#4CAF50', textAlign: 'center' }, 

    trialContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#EEEEEE', paddingVertical: normalize(12), paddingHorizontal: normalize(20),
        borderRadius: 30, width: '100%', marginBottom: normalize(25), minHeight: normalize(50)
    },
    trialTextWrapper: { flex: 1, marginRight: 10 },
    trialText: { fontSize: normalize(14), color: '#666', fontWeight: '500' },

    // --- STYLE CARD ---
    planCard: {
        width: '100%',
        borderRadius: 20,
        padding: normalize(20),
        marginBottom: normalize(15),
        position: 'relative', 
        borderWidth: 2,
        minHeight: normalize(80),
        justifyContent: 'center'
    },
    
    planCardSelected: {
        backgroundColor: 'rgba(253, 216, 53, 0.1)', 
        borderColor: '#FDD835',     
    },
    
    planCardNormal: {
        backgroundColor: '#EEEEEE',
        borderColor: 'transparent',
    },

    planContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planInfo: { flex: 1, marginRight: 10 },
    
    planTitle: { 
        fontSize: normalize(16), 
        fontWeight: 'bold', 
        color: '#333'
    },
    
    priceContainer: { alignItems: 'flex-end', flexShrink: 0 },
    
    priceMain: { 
        fontSize: normalize(16), 
        fontWeight: 'bold', 
        color: '#333'
    },
    
    priceSub: { fontSize: normalize(12), color: '#555', marginTop: 4 },

    badge: {
        position: 'absolute', top: -12, right: 20,
        backgroundColor: '#FDD835', paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 12, zIndex: 10, elevation: 3,
        shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.15, shadowRadius: 2
    },
    badgeText: { fontSize: normalize(12), fontWeight: 'bold', color: '#333' },

    disclaimer: {
        fontSize: normalize(13), color: '#999',
        marginTop: normalize(5), marginBottom: normalize(20), textAlign: 'center'
    },
    
    ctaButton: {
        backgroundColor: '#FDD835', width: '100%', paddingVertical: normalize(16),
        borderRadius: 16, alignItems: 'center', marginBottom: 10,
        shadowColor: "#FDD835", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5
    },
    ctaText: { fontSize: normalize(18), fontWeight: 'bold', color: '#333' }
});