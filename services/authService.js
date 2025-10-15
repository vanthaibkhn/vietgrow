// services/authService.js
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseClient } from '@/lib/firebaseClient';

export const authService = {
  async register(email, password) {
    console.log('[AuthService] 🚀 Register:', email);
    const { auth, db } = await getFirebaseClient();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      email,
      createdAt: new Date(),
      freeQuotaUsed: 0,
      lastResetDate: new Date().toISOString().slice(0, 10),
    });

    console.log('[AuthService] ✅ User registered:', user.uid);
    return { uid: user.uid, email: user.email };
  },

  async login(email, password) {
    console.log('[AuthService] 🚀 Login:', email);
    const { auth } = await getFirebaseClient();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('[AuthService] ✅ Login success:', user.uid);
    return { uid: user.uid, email: user.email };
  },

  async getUser(uid) {
    console.log('[AuthService] 🔍 Fetching user from Firestore:', uid);
    const { db } = await getFirebaseClient();
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  },

  async updateQuota(uid, newCount) {
    console.log('[AuthService] ⚙️ Updating quota for:', uid);
    const { db } = await getFirebaseClient();
    const today = new Date().toISOString().slice(0, 10);
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { freeQuotaUsed: newCount, lastResetDate: today });
  },
};

