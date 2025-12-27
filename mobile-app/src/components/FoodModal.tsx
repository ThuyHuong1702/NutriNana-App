import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    Image, 
    ScrollView, 
    TouchableOpacity, 
    StyleSheet, 
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NumberKeypad from './NumberKeypad';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);
const IMAGE_SIZE = SCREEN_HEIGHT < 700 ? 60 : 80;

export default function FoodModal({ visible, item, onClose, onAddToCart, backendUrl }: any) {
    const [amountStr, setAmountStr] = useState('1');
    useEffect(() => {
        if (visible && item) {
            if (item.quantity && item.quantity > 0) {
                setAmountStr(String(item.quantity));
            } else {
                setAmountStr('1');
            }
        }
    }, [visible, item]);

    if (!item) return null;
    const quantity = parseFloat(amountStr) || 0;
    const rawProtein = item.PROTEIN || item.protein || 0;
    const rawCarb = item.CARB || item.carb || 0;
    const rawFat = item.FAT || item.fat || 0;
    const baseCal = item.CALORIES || item.calories || (item.displayCal / (item.quantity || 1)) || 0;
    const totalCal = Math.round(baseCal * quantity);
    let imageSource = require('@/assets/images/react-logo.png');
    const dbPath = item.IMAGE_PATH || item.image_url;
    if (dbPath) {
        if(dbPath.startsWith('http')) imageSource = { uri: dbPath };
        else imageSource = { uri: `${backendUrl}/${dbPath.startsWith('/')?dbPath.substring(1):dbPath}` };
    }

    const handleSave = () => {
        onAddToCart({
            ...item,
            id: item.id || item.C_FOOD_ID,
            displayName: item.DISH_NAME || item.displayName || item.name,
            displayCal: totalCal,
            quantity: quantity,
            displayImage: imageSource,
            unit: item.UNIT || item.unit || 'phần',
            PROTEIN: rawProtein,
            CARB: rawCarb,
            FAT: rawFat
        });
        onClose();
    };
    const isEditing = item.quantity && item.quantity > 0;

    return (
        <Modal 
            visible={visible} 
            animationType="fade" 
            transparent={true} 
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title} numberOfLines={1}>
                            {isEditing ? 'Cập nhật món ăn' : 'Thêm món mới'}
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                            <Ionicons name="close" size={26} color="#555"/>
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <Image 
                            source={imageSource} 
                            style={[styles.image, { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: IMAGE_SIZE/2 }]} 
                            resizeMode="cover"
                        />
                        <Text style={styles.foodName} numberOfLines={2} adjustsFontSizeToFit>
                            {item.DISH_NAME || item.displayName || item.name}
                        </Text>
                        {isEditing && (
                            <View style={styles.dbInfoTag}>
                                <Ionicons name="cloud-done-outline" size={12} color="#F57F17" />
                                <Text style={styles.dbInfoText}>Đã lưu: {item.quantity} của {item.UNIT || 'phần'}</Text>
                            </View>
                        )}
                        <View style={styles.calBadge}>
                            <Text style={styles.calText}>{totalCal} Kcal</Text>
                        </View>
                        <View style={styles.macroRow}>
                            <MacroItem 
                                label="Protein" 
                                val={(rawProtein * quantity).toFixed(1)} 
                                color="#E91E63"
                            />
                            <MacroItem 
                                label="Carb" 
                                val={(rawCarb * quantity).toFixed(1)} 
                                color="#2196F3"
                            />
                            <MacroItem 
                                label="Fat" 
                                val={(rawFat * quantity).toFixed(1)} 
                                color="#FF9800"
                            />
                        </View>
                        <View style={styles.amountContainer}>
                            <Text style={styles.amountDisplay} maxFontSizeMultiplier={1.5} numberOfLines={1}>
                                {amountStr}
                            </Text>
                            <Text style={styles.unitText} maxFontSizeMultiplier={1.2}>
                                ( Đơn vị đo {item.UNIT || item.unit || 'phần'} )
                            </Text>
                        </View>
                    </ScrollView>
                    <NumberKeypad 
                        onPress={(k:string) => (amountStr === '0' && k !== '.') ? setAmountStr(k) : (amountStr.length < 6 && setAmountStr(prev => prev + k))}
                        onDelete={() => setAmountStr(prev => prev.length > 1 ? prev.slice(0,-1) : '0')}
                        onSave={handleSave}
                    />
                </View>
            </View>
        </Modal>
    );
}

const MacroItem = ({label, val, color}: any) => (
    <View style={styles.macroItem}>
        <Text style={[styles.macroLabel, {color}]}>{label}</Text>
        <Text style={styles.macroValue} numberOfLines={1}>{val}g</Text>
    </View>
);

const styles = StyleSheet.create({
    modalOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20 
    },
    modalContainer: { 
        width: MODAL_WIDTH,
        maxWidth: '100%',
        maxHeight: '90%',
        backgroundColor: '#fff', 
        borderRadius: 20, 
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 10 },
            android: { elevation: 10 }
        })
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: 16, 
        borderBottomWidth: 1, 
        borderColor: '#eee',
        backgroundColor: '#fff'
    },
    title: { 
        fontWeight: 'bold', 
        fontSize: 16, 
        color: '#333',
        flex: 1 
    },
    scrollContent: { 
        alignItems: 'center', 
        paddingVertical: 20,
        paddingHorizontal: 16,
        flexGrow: 1 
    },
    image: { 
        backgroundColor:'#eee',
        marginBottom: 12
    },
    foodName: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 8, 
        textAlign: 'center',
        color: '#333',
        maxWidth: '90%'
    },
    dbInfoTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#FFECB3'
    },
    dbInfoText: {
        fontSize: 12,
        color: '#F57F17',
        marginLeft: 4,
        fontWeight: '500'
    },
    calBadge: { 
        backgroundColor: '#FFF9C4', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 16, 
        marginBottom: 20 
    },
    calText: { 
        fontSize: 16, 
        color: '#C79100', 
        fontWeight: 'bold' 
    },
    macroRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        width: '100%', 
        marginBottom: 20 
    },
    macroItem: {
        alignItems: 'center',
        flex: 1
    },
    macroLabel: {
        fontWeight: 'bold', 
        fontSize: 12,
        marginBottom: 2
    },
    macroValue: {
        fontSize: 14, 
        color: '#333'
    },
    amountContainer: {
        alignItems: 'center',
        marginBottom: 10
    },
    amountDisplay: { 
        fontSize: 48, 
        fontWeight: 'bold', 
        color: '#C79100',
        includeFontPadding: false
    },
    unitText: { 
        fontSize: 14, 
        color: '#888',
    }
});