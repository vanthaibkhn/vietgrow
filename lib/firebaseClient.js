// lib/firebaseClient.js
// ✅ Final Version with Super Extended Debug Logs & Client/Server Detection
// Safe Firebase Client SDK initialization for Next.js 15+
// Support: Firebase v12+, Turbopack, and client-side dynamic imports

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDB = null;

export async function getFirebaseClient() {
  // ✅ Kiểm tra môi trường chạy
  const isClient = typeof window !== "undefined";
  console.log(
    `[firebaseClient] ⚙️ getFirebaseClient() called — running on: ${
      isClient ? "Client" : "Server"
    }`
  );

  if (!isClient) {
    console.warn(
      "[firebaseClient] ⚠️ This is a server context (SSR). Firebase Client SDK will not initialize."
    );
    return {};
  }

  // ✅ Nếu app đã khởi tạo, tái sử dụng
  if (firebaseApp && firebaseAuth && firebaseDB) {
    console.log("[firebaseClient] ⚡ Reusing existing Firebase client instance");
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDB };
  }

  // ✅ Log biến môi trường thực tế
  console.log("[firebaseClient] 🔍 Checking environment variables...");
  console.table({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ? "✅ Loaded"
      : "❌ Missing",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? "✅ Loaded"
      : "❌ Missing",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "❌ Missing",
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "❌ Missing",
  });

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  console.log("[firebaseClient] 🔍 Loaded config object:", firebaseConfig);

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
      "[firebaseClient] ❌ Missing essential Firebase config values — Check .env.local (must start with NEXT_PUBLIC_)"
    );
  }

  console.time("[firebaseClient] ⏱️ Firebase init time");
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  console.timeEnd("[firebaseClient] ⏱️ Firebase init time");

  firebaseApp = app;
  firebaseAuth = auth;
  firebaseDB = db;

  console.log("[firebaseClient] ✅ Firebase client initialized successfully");
  console.log("[firebaseClient] 🧩 App name:", app.name);
  console.log("[firebaseClient] 🧩 Project ID:", app.options?.projectId);
  console.log("[firebaseClient] 🧩 Full options:", app.options);

  return { app, auth, db };
}

