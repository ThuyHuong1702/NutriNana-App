// src/config/firebase.js
import { initializeApp } from 'firebase/app';
// Import thêm Auth để dùng chức năng đăng nhập
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// 1. Thay thông tin từ Firebase Console vào đây
const firebaseConfig = {
  apiKey: "AIzaSyBgzi8n9aYYAw8AknvYnnwUh-4sPR_za30",
  authDomain: "nutrinana-be355.firebaseapp.com",
  projectId: "nutrinana-be355",
  storageBucket: "nutrinana-be355.firebasestorage.app",
  messagingSenderId: "756875053212",
  appId: "1:756875053212:web:c92838506404b195d24559"
};

// 2. Khởi tạo App
const app = initializeApp(firebaseConfig);

// 3. Khởi tạo Auth (có lưu trạng thái đăng nhập để tắt app không bị out)
// Cần cài thêm: npx expo install @react-native-async-storage/async-storage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };