import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Silence verbose connection retry warnings in development iframe environment
setLogLevel('error');

// Initialize Firestore with explicit databaseId as prescribed by Firebase guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export default app;

