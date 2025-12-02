// src/api/authApi.ts
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

// 1. Hàm Đăng Ký
// 👉 Sửa lỗi: Thêm ": string" để máy biết đây là chuỗi ký tự
export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date(),
      role: 'user'
    });

    return { success: true, user };
  } catch (error: any) { 
    // 👉 Sửa lỗi: Thêm ": any" để máy cho phép truy cập .message
    return { success: false, error: error.message };
  }
};

// 2. Hàm Đăng Nhập
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// 3. Hàm Đăng Xuất
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
// 3. Hàm Gửi Email Quên Mật Khẩu (Thêm mới)
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};