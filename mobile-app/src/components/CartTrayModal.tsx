import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    FlatList, 
    Modal, 
    ScrollView, 
    TouchableWithoutFeedback,
    Platform,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Lấy chiều cao màn hình để tính toán chiều cao Modal hợp lý
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';

interface CartTrayModalProps {
    visible: boolean;
    onClose: () => void;
    cartItems: any;       
    onRemoveItem: (tabKey: string, index: number, item: any) => void;
    currentMealLabel: string; 
    tabs: string[];       
    onItemPress: (item: any) => void; 
}

export default function CartTrayModal({ 
    visible, 
    onClose, 
    cartItems, 
    onRemoveItem, 
    currentMealLabel, 
    tabs, 
    onItemPress 
}: CartTrayModalProps) {
    
    const [activeTab, setActiveTab] = useState(currentMealLabel);

    useEffect(() => {
        if (visible && tabs.includes(currentMealLabel)) {
            setActiveTab(currentMealLabel);
        }
    }, [visible, currentMealLabel]);

    const currentList = cartItems[activeTab] || [];
    const currentMealCalories = currentList.reduce((sum: number, item: any) => sum + (item.displayCal || 0), 0);

    if (!visible) return null;

    return (
        <Modal 
            visible={visible} 
            animationType="slide" 
            transparent={true} 
            onRequestClose={onClose}
            statusBarTranslucent // Cho phép modal đè lên status bar trên Android
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.trayOverlay} />
            </TouchableWithoutFeedback>

            <View style={styles.trayContainer}>
                {/* --- Header --- */}
                <View style={styles.trayHeader}>
                    <View style={{flex: 1}}>
                        <Text style={styles.trayTitle}>Danh sách đã chọn</Text>
                        <Text style={styles.traySubTitle}>
                            Tổng: <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>{currentMealCalories} Kcal</Text>
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={onClose} 
                        style={styles.closeBtn}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    >
                        <Ionicons name="chevron-down" size={28} color="#999" />
                    </TouchableOpacity>
                </View>

                <View style={styles.trayBody}>
                    {/* --- Sidebar (Các Tab) --- */}
                    <View style={styles.traySidebar}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab;
                                const itemCount = (cartItems[tab] || []).length;
                                return (
                                    <TouchableOpacity 
                                        key={tab} 
                                        style={[styles.trayTabItem, isActive && styles.trayTabActive]}
                                        onPress={() => setActiveTab(tab)}
                                        activeOpacity={0.7}
                                    >
                                        {isActive && <View style={styles.activeIndicator} />}
                                        <Text 
                                            style={[styles.trayTabText, isActive && styles.trayTabTextActive]}
                                            numberOfLines={1}
                                        >
                                            {tab}
                                        </Text>
                                        {itemCount > 0 && !isActive && <View style={styles.trayDot} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* --- Content (Danh sách món) --- */}
                    <View style={styles.trayContent}>
                        <View style={styles.sectionHeader}>
                             <Text style={styles.traySectionTitle}>{activeTab} ({currentList.length})</Text>
                        </View>
                        
                        <FlatList
                            data={currentList}
                            keyExtractor={(item, index) => index.toString()}
                            contentContainerStyle={{paddingBottom: 20}}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="fast-food-outline" size={40} color="#DDD" />
                                    <Text style={styles.emptyText}>Chưa có món nào</Text>
                                </View>
                            }
                            renderItem={({ item, index }) => (
                                <View style={styles.trayItemRow}>
                                    <TouchableOpacity 
                                        style={styles.itemTouchArea} 
                                        onPress={() => {
                                            onClose(); 
                                            onItemPress(item); 
                                        }}
                                    >
                                        <Image 
                                            source={item.displayImage || require('@/assets/images/react-logo.png')} 
                                            style={styles.trayItemImg} 
                                            resizeMode="cover"
                                        />
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.trayItemName} numberOfLines={2} ellipsizeMode="tail">
                                                {item.displayName || item.DISH_NAME || item.name}
                                            </Text>
                                            <Text style={styles.trayItemSub} numberOfLines={1}>
                                                {item.displayCal} Kcal • {item.quantity} {item.unit || 'phần'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={styles.trashBtn} 
                                        onPress={() => onRemoveItem(activeTab, index, item)} 
                                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF5252" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                </View>

                {/* --- Footer --- */}
                <View style={styles.trayFooter}>
                    <TouchableOpacity style={styles.trayCompleteBtn} onPress={onClose}>
                        <Text style={styles.trayCompleteText}>Xong</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    trayOverlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)' 
    },
    trayContainer: { 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        height: SCREEN_HEIGHT * 0.7, // Chiếm 70% màn hình thay vì fix cứng
        backgroundColor: '#FFF', 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20, 
        overflow: 'hidden',
        // Shadow cho iOS/Android
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 5 },
            android: { elevation: 20 }
        })
    },
    trayHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F0F0F0', 
        backgroundColor: '#FFF' 
    },
    closeBtn: {
        padding: 4
    },
    trayTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    traySubTitle: { 
        fontSize: 13, 
        color: '#666', 
        marginTop: 4 
    },
    trayBody: { 
        flex: 1, 
        flexDirection: 'row' 
    },
    // Sidebar: Cố định width 100 để không bị vỡ khi màn hình nhỏ
    traySidebar: { 
        width: 100, 
        backgroundColor: '#F7F9FC', 
        borderRightWidth: 1, 
        borderRightColor: '#EEE' 
    },
    trayTabItem: { 
        paddingVertical: 18, 
        paddingHorizontal: 8, 
        justifyContent: 'center', 
        alignItems: 'center',
        position: 'relative',
        width: '100%'
    },
    trayTabActive: { 
        backgroundColor: '#FFF' 
    },
    activeIndicator: { 
        position: 'absolute', 
        left: 0, 
        top: 15, 
        bottom: 15, 
        width: 4, 
        backgroundColor: '#FDD835', 
        borderTopRightRadius: 3, 
        borderBottomRightRadius: 3 
    },
    trayTabText: { 
        fontSize: 13, 
        color: '#777', 
        fontWeight: '500', 
        textAlign: 'center' 
    },
    trayTabTextActive: { 
        color: '#333', 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    trayDot: { 
        position: 'absolute', 
        top: 16, 
        right: 8, 
        width: 6, 
        height: 6, 
        borderRadius: 3, 
        backgroundColor: '#FF5252' 
    },
    // Content: Sử dụng flex: 1 để chiếm hết phần còn lại
    trayContent: { 
        flex: 1, 
        backgroundColor: '#FFF', 
        paddingHorizontal: 16 
    },
    sectionHeader: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FAFAFA'
    },
    traySectionTitle: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#555', 
        textTransform: 'uppercase' 
    },
    emptyState: {
        marginTop: 60, 
        alignItems: 'center', 
        opacity: 0.6
    },
    emptyText: {
        color: '#999', 
        marginTop: 10,
        fontSize: 14
    },
    trayItemRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 12,
        borderBottomWidth: 1, 
        borderBottomColor: '#F5F5F5' 
    },
    itemTouchArea: {
        flexDirection: 'row', 
        flex: 1, 
        alignItems: 'center'
    },
    trayItemImg: { 
        width: 48, 
        height: 48, 
        borderRadius: 8, 
        backgroundColor: '#F5F5F5', 
        marginRight: 12 
    },
    itemInfo: {
        flex: 1,
        paddingRight: 8
    },
    trayItemName: { 
        fontSize: 15, 
        fontWeight: '600', 
        color: '#333', 
        marginBottom: 4,
        lineHeight: 20
    },
    trayItemSub: { 
        fontSize: 12, 
        color: '#888' 
    },
    trashBtn: { 
        padding: 8, 
        backgroundColor: '#FFEBEE', 
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    trayFooter: { 
        padding: 16, 
        borderTopWidth: 1, 
        borderTopColor: '#EEE', 
        backgroundColor: '#FFF',
        // Xử lý Safe Area cho iPhone dòng X trở lên
        paddingBottom: IS_IOS ? 34 : 16 
    },
    trayCompleteBtn: { 
        backgroundColor: '#FDD835', 
        borderRadius: 25, 
        paddingVertical: 12, 
        alignItems: 'center',
        width: '100%'
    },
    trayCompleteText: { 
        color: '#333', 
        fontSize: 16, 
        fontWeight: 'bold' 
    },
});