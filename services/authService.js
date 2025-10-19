// services/authService.js
// ✅ Hybrid Auth Service: dùng Client SDK trên browser, Admin SDK trên server
import { getFirebaseAdmin } from "../lib/firebase.js";
import { getFirebaseClient } from "../lib/firebaseClient.js";

export const authService = {
  /**
   * 🔹 Lấy user info (dùng trong server-side)
   */
  async getUser(uid) {
    try {
      const { admin } = getFirebaseAdmin();
      const userRecord = await admin.auth().getUser(uid);
      console.log("[authService] ✅ Server: User found:", userRecord.uid);
      return userRecord.toJSON();
    } catch (err) {
      console.warn("[authService] ⚠️ getUser failed:", err.message);
      return null;
    }
  },

  /**
   * 🔹 Đăng ký (client-side)
   */
  async register(email, password) {
    try {
      const { auth, createUserWithEmailAndPassword } = await getFirebaseClient();
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[authService] ✅ Client: User registered:", userCred.user.uid);
      return userCred.user;
    } catch (err) {
      console.error("[authService] 💥 register error:", err.message);
      throw err;
    }
  },

  /**
   * 🔹 Đăng nhập (client-side)
   */
  async login(email, password) {
    try {
      const { auth, signInWithEmailAndPassword } = await getFirebaseClient();
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      console.log("[authService] ✅ Client: User logged in:", userCred.user.uid);
      return userCred.user;
    } catch (err) {
      console.error("[authService] 💥 login error:", err.message);
      throw err;
    }
  },
};

