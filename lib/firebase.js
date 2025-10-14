// lib/firebase.js (safe version)
import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccountKey.json';
const USE_FIRESTORE = String(process.env.USE_FIRESTORE).toLowerCase() === 'true';

let db = null;

if (USE_FIRESTORE) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    db = admin.firestore();
    console.log('[lib/firebase] Firestore initialized ✅');
  } catch (err) {
    console.error('[lib/firebase] Failed to init Firestore:', err.message);
  }
} else {
  console.log('[lib/firebase] Firestore disabled — using local Filestore ✅');
}

export { db };
export default db;

