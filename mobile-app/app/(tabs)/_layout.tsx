import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Thư viện icon có sẵn

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32', // Màu xanh lá khi được chọn
        tabBarInactiveTintColor: 'gray',  // Màu xám khi không chọn
        headerShown: false,               // Ẩn thanh tiêu đề ở trên cùng
      }}>
      
      {/* 1. Màn hình Trang Chủ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      {/* 2. Màn hình Camera AI */}
      <Tabs.Screen
        name="camera"
        options={{
          title: 'AI Camera',
          tabBarIcon: ({ color }) => <Ionicons name="camera" size={24} color={color} />,
        }}
      />

      {/* 3. Màn hình Cá nhân */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}