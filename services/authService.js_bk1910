// services/authService.js
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebaseClient";

export const authService = {
  async register(email, password) {
    console.log("[authService] 🚀 Register:", email);
    const { auth, db } = await getFirebaseClient();

    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // 🔹 Lưu thông tin user vào Firestore
    await setDoc(doc(db, "users", user.uid), {
      email,
      createdAt: new Date().toISOString(),
      freeQuotaUsed: 0,
      lastResetDate: new Date().toISOString().slice(0, 10),
    });

    console.log("[authService] ✅ User created:", user.uid);
    return { uid: user.uid, email: user.email };
  },

  async login(email, password) {
    console.log("[authService] 🚀 Login:", email);
    const { auth } = await getFirebaseClient();

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    return { uid: user.uid, email: user.email };
  },

  async getUser(uid) {
    const { db } = await getFirebaseClient();
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { uid, ...snap.data() } : null;
  },

  async updateQuota(uid, newCount) {
    const { db } = await getFirebaseClient();
    const ref = doc(db, "users", uid);
    const today = new Date().toISOString().slice(0, 10);
    await updateDoc(ref, { freeQuotaUsed: newCount, lastResetDate: today });
    console.log(`[authService] 🔄 Updated quota for ${uid} → ${newCount}`);
  },
};

