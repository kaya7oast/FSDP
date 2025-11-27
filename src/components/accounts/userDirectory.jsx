import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Sidebar from "../Sidebar.jsx";

export default function UserDirectory() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getDocs(collection(db, "users")).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Community Directory</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
              <img src={user.photoURL} className="w-12 h-12 rounded-full" alt={user.username} />
              <div>
                <p className="font-bold dark:text-white">{user.username}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}