import React from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  categories: string[];
  selectedCategory: string;
  onSelect: (cat: string) => void;
}

export const CategorySidebar = ({ categories, selectedCategory, onSelect }: Props) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedCategory === item;
          return (
            <TouchableOpacity
              style={[styles.itemBtn, isSelected && styles.itemSelected]}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
              // Hỗ trợ trình đọc màn hình
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              {/* Thanh vàng chỉ thị */}
              {isSelected && <View style={styles.activeBar} />}
              
              <Text 
                style={[styles.itemText, isSelected && styles.itemTextSelected]}
                numberOfLines={2} // Cho phép xuống dòng tối đa 2 dòng
                ellipsizeMode="tail" // Nếu dài quá 2 dòng thì ...
                adjustsFontSizeToFit // Tự thu nhỏ chữ nhẹ nếu quá chật (chỉ trên iOS)
                minimumFontScale={0.8}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, // Chiếm hết chiều rộng/cao mà cha cho phép
    backgroundColor: '#F9F9F9', 
    borderRightWidth: 1, 
    borderRightColor: '#EFEFEF' 
  },
  listContent: {
    paddingBottom: 20 
  },
  itemBtn: { 
    // Không dùng height cố định, dùng minHeight để đảm bảo vùng chạm
    minHeight: 60, 
    width: '100%',
    paddingVertical: 12, 
    paddingHorizontal: 4, // Padding ngang nhỏ để dành chỗ cho text
    justifyContent: 'center', // Căn giữa nội dung theo chiều dọc
    alignItems: 'center',
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0',
    position: 'relative', // Để activeBar absolute theo thằng này
  },
  itemSelected: { 
    backgroundColor: '#FFF' 
  },
  itemText: { 
    fontSize: 13, // Kích thước cơ bản
    color: '#666', 
    textAlign: 'center', 
    fontWeight: '500',
    width: '100%', // Text chiếm hết chiều ngang nút
  },
  itemTextSelected: { 
    color: '#D4A017', 
    fontWeight: 'bold' 
  },
  activeBar: { 
    position: 'absolute', 
    left: 0, 
    // Thay vì top/bottom cố định, dùng height % và căn giữa
    height: '60%', 
    top: '20%', // (100% - 60%) / 2 = 20% -> Luôn nằm giữa bất kể chiều cao item
    width: 4, 
    backgroundColor: '#FDD835', 
    borderTopRightRadius: 2, 
    borderBottomRightRadius: 2 
  },
});