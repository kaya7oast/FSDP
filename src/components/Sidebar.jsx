import React from 'react';
import { NavLink } from 'react-router-dom';

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
          : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
      }`
    }
  >
    <span className="material-symbols-outlined text-[22px]">{icon}</span>
    <span className="font-medium text-sm">{label}</span>
  </NavLink>
);

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-background-dark border-r h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">AI Agents</h1>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <NavLink to="/dashboard" end className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <span>My Agents</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/builder" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <span>Create New Agent</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/conversations" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <span>Conversations</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* User Profile / Footer */}
      <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
        <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all group">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500 transition-all">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600">Admin User</p>
            <p className="text-xs text-slate-400">Pro Plan</p>
          </div>
        </button>
      </div>
    </aside>
  );
}