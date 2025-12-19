import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Dimensions, PixelRatio 
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

const LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export default function LanguageScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedLang, setSelectedLang] = useState('vi');

    const handleSelectLanguage = (code: string) => {
        setSelectedLang(code);
    };

    const renderItem = ({ item }: { item: any }) => {
        const isSelected = selectedLang === item.code;

        return (
            <TouchableOpacity 
                style={[
                    styles.itemContainer,
                    isSelected && styles.itemSelected
                ]} 
                onPress={() => handleSelectLanguage(item.code)}
                activeOpacity={0.7}
            >

                <View style={styles.leftContent}>
                    <Text style={styles.flag} maxFontSizeMultiplier={1.2}>{item.flag}</Text>
              
                    <View style={styles.textWrapper}>
                        <Text 
                            style={[
                                styles.label, 
                                isSelected && styles.labelSelected
                            ]}
                            maxFontSizeMultiplier={1.2}
                            numberOfLines={1}           
                            adjustsFontSizeToFit        
                        >
                            {item.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.rightContent}>
                    {isSelected && (
                        <Ionicons name="checkmark-circle" size={normalize(24)} color="#4CAF50" />
                    )}
                </View>
            </TouchableOpacity>
        );
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
                    <Ionicons name="arrow-back" size={normalize(24)} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
                    Ngôn ngữ giao diện
                </Text>
                <View style={{ width: normalize(24) }} /> 
            </View>

            {/* List */}
            <FlatList
                data={LANGUAGES}
                keyExtractor={(item) => item.code}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(20),
        paddingVertical: normalize(15),
    },
    backButton: { padding: 5 },
    headerTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: '#000',
        flex: 1,            
        textAlign: 'center'  
    },
    listContent: {
        paddingHorizontal: normalize(20),
        paddingTop: normalize(10),
        paddingBottom: normalize(30),
    },

    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingVertical: normalize(15),
        paddingHorizontal: normalize(20),
        marginBottom: normalize(12),
        borderWidth: 1,
        borderColor: 'transparent',
        minHeight: normalize(60)
    },
    itemSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, 
        marginRight: 10
    },
    flag: {
        fontSize: normalize(24),
        marginRight: normalize(15),
    },

    textWrapper: {
        flex: 1, 
        justifyContent: 'center'
    },
    label: {
        fontSize: normalize(16),
        color: '#333',
        fontWeight: '500',
    },
    labelSelected: {
        fontWeight: 'bold',
        color: '#2E7D32',
    },

    rightContent: {
        width: normalize(24),
        alignItems: 'center',
        justifyContent: 'center'
    }
});