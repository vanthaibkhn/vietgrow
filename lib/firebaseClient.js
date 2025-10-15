// lib/firebaseClient.js
// Safe dynamic client Firebase init for Next.js + Turbopack + Firebase v12+

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDB = null;

export async function getFirebaseClient() {
  if (firebaseApp && firebaseAuth && firebaseDB) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDB };
  }

  console.log('[firebaseClient] ⚙️ Initializing Firebase client dynamically...');

  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  const { getFirestore } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  firebaseAuth = getAuth(firebaseApp);
  firebaseDB = getFirestore(firebaseApp);

  console.log('[firebaseClient] ✅ Firebase client initialized successfully');
  return { app: firebaseApp, auth: firebaseAuth, db: firebaseDB };
}

