import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const getEnv = (key: string) => (import.meta as any).env[key];

const isValidKey = (key: string | undefined) => !!key && !key.includes('@') && key.length >= 20;

const envApiKey = getEnv('VITE_FIREBASE_API_KEY');
const envAuthDomain = getEnv('VITE_FIREBASE_AUTH_DOMAIN');
const envProjectId = getEnv('VITE_FIREBASE_PROJECT_ID');

const firebaseConfig = {
  apiKey: isValidKey(envApiKey) ? envApiKey : firebaseConfigJson.apiKey,
  authDomain: (envAuthDomain && envAuthDomain.includes('.')) ? envAuthDomain : (firebaseConfigJson.authDomain || (envProjectId ? `${envProjectId}.firebaseapp.com` : '')),
  projectId: envProjectId || firebaseConfigJson.projectId,
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || firebaseConfigJson.storageBucket,
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || firebaseConfigJson.messagingSenderId,
  appId: getEnv('VITE_FIREBASE_APP_ID') || firebaseConfigJson.appId
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

function getFirebaseApp() {
  const { apiKey, authDomain, projectId } = firebaseConfig;
  
  if (!apiKey || apiKey.includes('@')) {
    console.error('Firebase Configuration Error: API Key is missing or invalid.', firebaseConfig);
    throw new Error('Firebase Configuration Error: Please check your project settings or API key in the AI Studio Settings menu.');
  }
  
  if (!authDomain || !authDomain.includes('.firebaseapp.com')) {
    // Attempting to fix common misconfiguration: if only project ID is provided for authDomain
    if (projectId && !authDomain) {
      firebaseConfig.authDomain = `${projectId}.firebaseapp.com`;
    } else if (authDomain && !authDomain.includes('.')) {
      firebaseConfig.authDomain = `${authDomain}.firebaseapp.com`;
    } else {
      throw new Error('Invalid Firebase Auth Domain. Ensure VITE_FIREBASE_AUTH_DOMAIN is correctly set (e.g., project-id.firebaseapp.com).');
    }
  }

  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

export const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
};

export const getFirestoreDb = (): Firestore => {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp(), firebaseConfigJson.firestoreDatabaseId);
  }
  return firestoreInstance;
};

export const getGoogleProvider = (): GoogleAuthProvider => {
  if (!googleProviderInstance) {
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({
      prompt: 'select_account'
    });
  }
  return googleProviderInstance;
};
