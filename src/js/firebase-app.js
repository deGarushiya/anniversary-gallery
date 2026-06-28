import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let instance = null;

export function getFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (!instance) {
    const app = initializeApp(firebaseConfig);
    instance = {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
      storage: getStorage(app),
    };
  }
  return instance;
}

export function watchAuth(callback) {
  const { auth } = getFirebase();
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  const { auth } = getFirebase();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInWithEmail(email, password) {
  const { auth } = getFirebase();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function firebaseSignOut() {
  const { auth } = getFirebase();
  return signOut(auth);
}
