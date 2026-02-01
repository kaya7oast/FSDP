import React from 'react';

const Header = () => {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-8 py-4">
      <h2 className="text-lg font-bold">Dashboard</h2>
      <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200">
        <span className="material-symbols-outlined">settings</span>
      </button>
    </header>
  );
};

export default Header;