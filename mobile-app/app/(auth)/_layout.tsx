//app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="landing" />
      {/* Sau này thêm login.tsx và signup.tsx vào đây */}
    </Stack>
  );
}