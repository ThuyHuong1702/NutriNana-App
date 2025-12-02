import { Redirect } from 'expo-router';

export default function Index() {
  // Điều hướng người dùng đến màn hình Welcome
  return <Redirect href="/(auth)/welcome" />;
}