import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar"; // Re-using your existing Sidebar

export default function AccountPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});

  useEffect(() => {
    if (currentUser) {
      getDoc(doc(db, "users", currentUser.uid)).then(snap => {
        if (snap.exists()) setProfile(snap.data());
      });
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={currentUser?.photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{currentUser?.displayName}</h1>
              <p className="text-slate-500">{currentUser?.email}</p>
              <p className="text-xs text-blue-500 mt-1">{profile.role || "User"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200">
            Log Out
          </button>
        </div>

        <h2 className="text-xl font-bold mb-4 dark:text-white">My Agents</h2>
        <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-xl">
          <p className="text-slate-500">Your agents will appear here once MongoDB is back online.</p>
        </div>
      </main>
    </div>
  );
}