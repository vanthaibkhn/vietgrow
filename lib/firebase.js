// lib/firebase.js
// ✅ Firebase Admin SDK - Server-side initialization (Final)
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let firebaseAdminApp = null;
let db = null;

export function getFirebaseAdmin() {
  if (!firebaseAdminApp) {
    console.log("[lib/firebase] ⚙️ Initializing Firebase Admin...");

    let serviceAccount = null;
    const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const filePath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";

    try {
      if (envJson) {
        serviceAccount = JSON.parse(envJson);
        console.log("[lib/firebase] 🔐 Loaded service account from env FIREBASE_SERVICE_ACCOUNT");
      } else if (fs.existsSync(path.resolve(filePath))) {
        const raw = fs.readFileSync(path.resolve(filePath), "utf-8");
        serviceAccount = JSON.parse(raw);
        console.log(`[lib/firebase] 🔐 Loaded service account from file: ${filePath}`);
      } else {
        console.warn("[lib/firebase] ⚠️ No service account found (env or file). Using default credentials.");
      }
    } catch (err) {
      console.error("[lib/firebase] 💥 Failed to parse service account:", err.message);
    }

    try {
      if (!admin.apps.length) {
        firebaseAdminApp = serviceAccount
          ? admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            })
          : admin.initializeApp();
      } else {
        firebaseAdminApp = admin.app();
      }

      // ✅ FIX: gọi firestore() từ chính instance app để tránh lỗi "not initialized"
      db = firebaseAdminApp.firestore();

      console.log("[lib/firebase] ✅ Firebase Admin initialized successfully");
    } catch (err) {
      console.error("[lib/firebase] 💥 Admin initialization failed:", err.message);
    }
  }

  return { admin, db };
}

export { admin, db };

