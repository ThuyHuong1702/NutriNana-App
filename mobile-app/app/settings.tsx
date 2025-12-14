// app/settings.tsx
import React from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, PixelRatio 
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

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const menuItems = [
        {
            title: "Nhắc nhở uống nước",
            route: "/water-reminder", 
            icon: "alarm-outline" 
        },
        {
            title: "Thiết lập ghi nhanh",
            route: "/water-quick-setup", 
            icon: "create-outline"
        },
        {
            title: "Thông tin dữ liệu đồ uống",
            route: "/water-info", 
            icon: "information-circle-outline"
        }
    ];

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
                <Text style={styles.headerTitle} maxFontSizeMultiplier={1.2}>Cài đặt</Text>
                <View style={{width: normalize(24)}} /> 
            </View>

            <ScrollView 
                contentContainerStyle={[
                    styles.content, 
                    { paddingBottom: Math.max(insets.bottom, 20) } 
                ]}
                showsVerticalScrollIndicator={false}
            >
                {menuItems.map((item, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.menuItem}
                        onPress={() => {
                            if (item.route) {
                                router.push(item.route as any);
                            } else {
                                console.log(`Navigating to ${item.title}`);
                            }
                        }}
                    >

                        <View style={styles.textContainer}>
                            <Text 
                                style={styles.menuText} 
                                maxFontSizeMultiplier={1.3} 
                            >
                                {item.title}
                            </Text>
                        </View>
                        
                        <Ionicons name="chevron-forward" size={normalize(20)} color="#5D4037" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: normalize(20), 
        paddingVertical: normalize(15),
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
        backgroundColor: '#fff',
        minHeight: normalize(60) 
    },
    backButton: {
        padding: 5
    },
    headerTitle: { 
        fontSize: normalize(18), 
        fontWeight: 'bold', 
        color: '#333' 
    },

    content: {
        padding: normalize(20),
        gap: normalize(15) 
    },
    menuItem: {
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        backgroundColor: '#F3E5AB', 
        paddingVertical: normalize(15),
        paddingHorizontal: normalize(20),
        borderRadius: normalize(25), 
        borderWidth: 1,
        borderColor: '#E0D090',
        minHeight: normalize(60) 
    },
    textContainer: {
        flex: 1, 
        paddingRight: 10 
    },
    menuText: {
        fontSize: normalize(16),
        fontWeight: '600', 
        color: '#5D4037',
        flexWrap: 'wrap'
    }
});