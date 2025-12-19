// app/add-exercise.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { auth } from '@/src/config/firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ListingLayout } from '@/src/components/listing/ListingLayout';
import ActivityModal from '@/src/components/ActivityModal';

const BACKEND_URL = 'http://192.168.1.3:8000'; 
const EXERCISE_CATEGORIES = ["Phổ biến", "Gần đây", "Yêu thích"];

export default function AddExerciseScreen() {
    const router = useRouter();
  
    //1. LẤY THAM SỐ DATE ĐƯỢC TRUYỀN TỪ HOME
    const params = useLocalSearchParams();
    // Nếu có params.date thì dùng, nếu không (trường hợp vào trực tiếp) thì lấy hôm nay
    const targetDate = params.date as string || new Date().toISOString().split('T')[0];

    //STATE
    const [selectedCategory, setSelectedCategory] = useState(EXERCISE_CATEGORIES[0]);
    const [searchText, setSearchText] = useState("");
    const [listData, setListData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [userWeight, setUserWeight] = useState(60); // Mặc định 60kg

    //LẤY CÂN NẶNG USER (Để tính calo chính xác)
    useEffect(() => {
        const fetchWeight = async () => {
            if (auth.currentUser) {
                try {
                    const res = await axios.get(`${BACKEND_URL}/api/get-profile/${auth.currentUser.uid}`);
                    if (res.data.success && res.data.data.WEIGHT) {
                        setUserWeight(res.data.data.WEIGHT);
                    }
                } catch (e) {
                    console.log("Error fetching weight:", e);
                }
            }
        };
        fetchWeight();
    }, []);

    //HÀM FETCH DATA
    const fetchListData = useCallback(async () => {
        setLoading(true);
        try {
            let url = "";
            const uid = auth.currentUser?.uid;
            if (searchText.trim().length > 0) {
                url = `${BACKEND_URL}/api/search-activity?q=${encodeURIComponent(searchText.trim())}`;
            } else {
                const baseUrl = `${BACKEND_URL}/api/activities`;
                
                if (selectedCategory === "Gần đây" || selectedCategory === "Yêu thích") {
                    if (uid) {
                        url = `${baseUrl}?category=${encodeURIComponent(selectedCategory)}&firebase_uid=${uid}`;
                    } else {
                        setListData([]); setLoading(false); return;
                    }
                } else {
                    url = `${baseUrl}?category=${encodeURIComponent(selectedCategory)}&firebase_uid=${uid || ''}`;
                }
            }

            console.log("Fetching Activity:", url);
            const res = await axios.get(url);
            if (res.data.success) {
                setListData(res.data.data);
            } else {
                setListData([]);
            }

        } catch (err) {
            console.log("Error fetching activity:", err);
            setListData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, searchText]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchListData();
        }, 500); 
        return () => clearTimeout(timeout);
    }, [fetchListData]);

    //RENDER ITEM (GIAO DIỆN TỪNG DÒNG)
    const renderActivityItem = ({ item }: { item: any }) => {
        let imageSource = require('@/assets/images/react-logo.png'); 
        const imgPath = item.image_url || item.IMAGE_PATH;
        if (imgPath) {
            imageSource = imgPath.startsWith('http') ? { uri: imgPath } : { uri: `${BACKEND_URL}/${imgPath}` };
        } 

        return (
            <TouchableOpacity 
                style={styles.itemRow} 
                onPress={() => { setSelectedItem(item); setModalVisible(true); }}
                activeOpacity={0.7}
            >
                <Image source={imageSource} style={styles.itemImage} resizeMode="cover"/>
                
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name || item.ACTIVITY_NAME}</Text>
                    
                    <Text style={styles.itemDesc}>
                         ~{item.cal_per_hour_base ? Math.round(item.cal_per_hour_base) : '---'} kcal/giờ
                    </Text>
                </View>
                
                <Ionicons name="add-circle" size={32} color="#4CAF50" />
            </TouchableOpacity>
        );
    };

    // RENDER TRANG CHÍNH
    return (
        <>
            {/* Sử dụng Layout chung */}
            <ListingLayout
                title="Vận động"
                searchPlaceholder="Tìm bài tập (Gym, chạy bộ...)"
                searchText={searchText}
                setSearchText={setSearchText}
                categories={EXERCISE_CATEGORIES}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                loading={loading}
                data={listData}
                renderItem={renderActivityItem}
                renderEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bicycle-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>Chưa có bài tập nào</Text>
                    </View>
                )}
                footerComponent={null}
            />

            {/* Modal Chi Tiết & Lưu */}
            <ActivityModal 
                visible={modalVisible}
                item={selectedItem}
                onClose={() => setModalVisible(false)}
                backendUrl={BACKEND_URL}
                userWeight={userWeight}
                targetDate={targetDate} 

                onSaveSuccess={() => {
                    fetchListData(); 
                }}
                onFavoriteToggled={() => fetchListData()}
            />
        </>
    );
}

// Styles
const styles = StyleSheet.create({
    itemRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: '#F0F0F0' 
    },
    itemImage: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        marginRight: 15, 
        backgroundColor: '#EEE' 
    },
    itemInfo: { 
        flex: 1 
    },
    itemName: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#333' 
    },
    itemDesc: { 
        fontSize: 13, 
        color: '#888', 
        marginTop: 2 
    },
    emptyContainer: { 
        alignItems: 'center', 
        marginTop: 50 
    },
    emptyText: { 
        color: '#999', 
        marginTop: 10, 
        fontSize: 16 
    }
});