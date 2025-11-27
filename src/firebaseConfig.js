import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAAnR5u7ZzRgFMVqZGVs0cy9Wyphcisp38",
  authDomain: "fsdp-auth.firebaseapp.com",
  projectId: "fsdp-auth",
  storageBucket: "fsdp-auth.firebasestorage.app",
  messagingSenderId: "815552199536",
  appId: "1:815552199536:web:3c041679d45cb8f449edb5",
  measurementId: "G-JS1C48NDEJ"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and export Authentication, Provider, and Firestore Database services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);