// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../firebaseConfig";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login with Google & Save User to Firestore
  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in database
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      // If new user, save their details
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          username: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role: "agent_builder",
          createdAt: new Date().toISOString(),
          bio: "I am a new Agent Creator!"
        });
      }
      return user;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}