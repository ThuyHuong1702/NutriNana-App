// src/components/listing/ListingHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Kích thước cố định cho 2 bên cánh gà (nút back và khoảng trống bên phải)
// Để đảm bảo tiêu đề luôn ở chính giữa
const SIDE_WIDTH = 48; 

export const ListingHeader = ({ title }: { title: string }) => {
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      {/* 1. KHỐI TRÁI: Nút Back */}
      <View style={styles.sideContainer}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
          // Tăng vùng chạm ảo xung quanh nút (tốt cho UX)
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 2. KHỐI GIỮA: Tiêu đề */}
      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>
          {title}
        </Text>
      </View>

      {/* 3. KHỐI PHẢI: Dummy View (Để cân bằng layout) */}
      <View style={styles.sideContainer} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Căn giữa theo chiều dọc
    justifyContent: 'space-between',
    paddingHorizontal: 8, // Padding nhỏ hơn vì sideContainer đã có độ rộng
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 50, // Đảm bảo chiều cao tối thiểu chuẩn
    // Border dưới mỏng để tách biệt header (tuỳ chọn)
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', 
  },
  sideContainer: {
    width: SIDE_WIDTH, // Độ rộng cố định cho 2 bên -> Title sẽ luôn ở giữa
    alignItems: 'flex-start', // Nút back nằm sát trái
    justifyContent: 'center',
  },
  backBtn: {
    padding: 4, // Padding nội bộ để icon không bị cắt
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1, // Chiếm toàn bộ không gian còn lại
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    // Xóa numberOfLines để cho phép xuống dòng nếu chữ quá to
    flexWrap: 'wrap', 
  },
});