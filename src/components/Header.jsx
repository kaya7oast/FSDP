import React from 'react';
import { useAuth } from '../context/AuthContext'; // Import Auth

const Header = () => {
  const { currentUser } = useAuth(); // Get current user

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-4 bg-white dark:bg-background-dark">
      <h2 className="text-lg font-bold dark:text-white">Dashboard</h2>
      
      <div className="flex items-center gap-4">
        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200">
          <span className="material-symbols-outlined">settings</span>
        </button>
        
        {/* User Profile Pic */}
        {currentUser && (
          <img 
            src={currentUser.photoURL || "https://via.placeholder.com/40"} 
            alt="User" 
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700"
          />
        )}
      </div>
    </header>
  );
};

export default Header;