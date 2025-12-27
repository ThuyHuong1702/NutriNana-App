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
          allowFontScaling={true} 
          multiline={false}
        />

        {value.length > 0 && (
          <TouchableOpacity 
            onPress={() => onChangeText("")} 
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
    width: '100%', 
  },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    backgroundColor: '#F0F0F0',
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
    minHeight: 40,
    paddingVertical: 0, 
    ...Platform.select({
      android: { textAlignVertical: 'center' } 
    })
  },
  clearBtn: {
    marginLeft: 4
  }
});