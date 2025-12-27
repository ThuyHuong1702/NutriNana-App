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
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              {isSelected && <View style={styles.activeBar} />}
              
              <Text 
                style={[styles.itemText, isSelected && styles.itemTextSelected]}
                numberOfLines={2} 
                ellipsizeMode="tail"
                adjustsFontSizeToFit
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
    flex: 1, 
    backgroundColor: '#F9F9F9', 
    borderRightWidth: 1, 
    borderRightColor: '#EFEFEF' 
  },
  listContent: {
    paddingBottom: 20 
  },
  itemBtn: { 
    minHeight: 60, 
    width: '100%',
    paddingVertical: 12, 
    paddingHorizontal: 4, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0',
    position: 'relative', 
  },
  itemSelected: { 
    backgroundColor: '#FFF' 
  },
  itemText: { 
    fontSize: 13,
    color: '#666', 
    textAlign: 'center', 
    fontWeight: '500',
    width: '100%',
  },
  itemTextSelected: { 
    color: '#D4A017', 
    fontWeight: 'bold' 
  },
  activeBar: { 
    position: 'absolute', 
    left: 0, 
    height: '60%', 
    top: '20%', 
    width: 4, 
    backgroundColor: '#FDD835', 
    borderTopRightRadius: 2, 
    borderBottomRightRadius: 2 
  },
});