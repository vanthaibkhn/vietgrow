// lib/firebase.js
// Server-side Firebase Admin initialization (safe)
import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT; // JSON string (optional)
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
const useFirestore = String(process.env.USE_FIRESTORE || 'true').toLowerCase() === 'true';

let adminApp = null;
let db = null;

try {
  if (!admin.apps.length) {
    let serviceAccount = null;

    if (serviceAccountEnv) {
      try {
        serviceAccount = JSON.parse(serviceAccountEnv);
        console.log('[lib/firebase] 🔐 Using FIREBASE_SERVICE_ACCOUNT from env (parsed JSON)');
      } catch (err) {
        console.warn('[lib/firebase] ⚠️ FIREBASE_SERVICE_ACCOUNT env present but not valid JSON. Falling back to file path.');
      }
    }

    if (!serviceAccount) {
      // try file path
      if (fs.existsSync(serviceAccountPath)) {
        try {
          const raw = fs.readFileSync(serviceAccountPath, 'utf-8');
          serviceAccount = JSON.parse(raw);
          console.log(`[lib/firebase] 🔐 Using service account file at ${serviceAccountPath}`);
        } catch (err) {
          console.error('[lib/firebase] 💥 Failed to parse service account file:', err.message);
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // rely on GOOGLE_APPLICATION_CREDENTIALS
        console.log('[lib/firebase] ℹ️ Using GOOGLE_APPLICATION_CREDENTIALS environment variable');
      } else {
        console.warn('[lib/firebase] ⚠️ No service account found (env or file). Admin SDK may not be fully initialized.');
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // fallback to default application credentials (if GOOGLE_APPLICATION_CREDENTIALS set)
      try {
        admin.initializeApp();
      } catch (err) {
        console.warn('[lib/firebase] ⚠️ admin.initializeApp() default failed:', err.message);
      }
    }
  }

  if (useFirestore) {
    try {
      db = admin.firestore();
      console.log('[lib/firebase] Firestore initialized ✅');
    } catch (err) {
      console.error('[lib/firebase] Failed to init Firestore:', err.message);
    }
  } else {
    console.log('[lib/firebase] Firestore disabled by config (USE_FIRESTORE=false)');
  }
} catch (err) {
  console.error('[lib/firebase] Unexpected error during initialization:', err.message);
}

export { admin, db };
export default { admin, db };

