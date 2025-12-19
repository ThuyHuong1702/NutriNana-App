import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Image, StyleSheet, Platform, Dimensions, PixelRatio, Text } from 'react-native';

const bananaIconSource = require('@/assets/images/banana-icon.png'); 
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

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D4E157',
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
        
        tabBarStyle: {
          height: Platform.OS === 'ios' ? normalize(85) : normalize(75),
          paddingBottom: Platform.OS === 'ios' ? normalize(25) : normalize(10),
          paddingTop: normalize(10),
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
            display: 'none' 
        }
      }}>

  
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: normalize(5), width: normalize(90) }}> 
                <Ionicons name={focused ? "home" : "home-outline"} size={normalize(24)} color={color} />
                <Text 
                    style={{ color, fontSize: normalize(12), fontWeight: '600', marginTop: 2 }}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                >
                    Trang chủ
                </Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          title: 'Chat with Nana',
          tabBarIcon: ({ focused }) => (
            <View style={styles.middleIconWrapper}>
                <View style={styles.middleIconContainer}>
                    <Image
                        source={bananaIconSource}
                        style={styles.bananaIcon}
                        resizeMode="contain"
                    />
                </View>
                
                <Text 
                    style={[
                        styles.middleText, 
                        { color: focused ? '#D4E157' : '#9E9E9E' } 
                    ]}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                >
                    Nana AI
                </Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', top: normalize(5), width: normalize(90) }}>
                <Ionicons name={focused ? "person" : "person-outline"} size={normalize(24)} color={color} />
                <Text 
                    style={{ color, fontSize: normalize(12), fontWeight: '600', marginTop: 2 }}
                    maxFontSizeMultiplier={1.2}
                    numberOfLines={1}
                >
                    Cá nhân
                </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  middleIconWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%', 
    width: normalize(100),
  },
  middleIconContainer: {
    position: 'absolute',
    bottom: normalize(25),
    height: normalize(65),
    width: normalize(65),
    borderRadius: normalize(32.5),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#4CAF50',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  bananaIcon: {
    width: normalize(45),
    height: normalize(45),
  },
  middleText: {
    fontSize: normalize(12),
    fontWeight: '600',
    color: '#999',
    marginBottom: Platform.OS === 'ios' ? normalize(0) : normalize(5),
  }
});