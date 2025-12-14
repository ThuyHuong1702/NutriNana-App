import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

export const ListingSearchBar = ({ placeholder, value, onChangeText }: Props) => {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBox}>
        {/* Search Icon */}
        <Ionicons name="search" size={20} color="#555" style={styles.searchIcon} />
        
        <TextInput
          placeholder={placeholder}
          style={styles.searchInput}
          placeholderTextColor="#666"
          autoCorrect={false}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          // Cho phép text tự scale theo hệ thống (quan trọng cho Accessibility)
          allowFontScaling={true} 
          // Chỉ 1 dòng
          multiline={false}
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <TouchableOpacity 
            onPress={() => onChangeText("")} 
            // Tăng vùng chạm cho nút xóa dễ bấm hơn
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: { 
    paddingHorizontal: 16, 
    marginBottom: 8,
    width: '100%', // Đảm bảo chiếm hết chiều ngang
  },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    backgroundColor: '#F0F0F0',
    
    // 1. QUAN TRỌNG: Thay height: 48 bằng minHeight + Padding
    // Để khi chữ to lên, hộp sẽ tự cao lên
    minHeight: 48, 
    paddingVertical: 6, 
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#333', 
    
    // 2. Bỏ height: '100%' vì cha nó không còn height cố định
    // Dùng minHeight để đảm bảo vùng chạm tốt
    minHeight: 40,
    
    // 3. Fix lỗi padding mặc định trên Android làm lệch chữ
    paddingVertical: 0, 
    ...Platform.select({
      android: { textAlignVertical: 'center' } // Căn giữa dọc chuẩn cho Android
    })
  },
  clearBtn: {
    marginLeft: 4
  }
});