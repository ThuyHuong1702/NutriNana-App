// src/components/listing/ListingHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SIDE_WIDTH = 48; 

export const ListingHeader = ({ title }: { title: string }) => {
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.sideContainer}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>
          {title}
        </Text>
      </View>

      <View style={styles.sideContainer} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 50, 
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', 
  },
  sideContainer: {
    width: SIDE_WIDTH, 
    alignItems: 'flex-start', 
    justifyContent: 'center',
  },
  backBtn: {
    padding: 4, 
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flexWrap: 'wrap', 
  },
});