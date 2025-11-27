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
    <aside className="w-20 lg:w-64 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-6 px-3 z-20 backdrop-blur-xl">
      <div>
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-2xl">hub</span>
          </div>
          <span className="hidden lg:block text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            AgentOS
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          <NavItem to="/dashboard" icon="dashboard" label="Agents" />
          <NavItem to="/analytics" icon="monitoring" label="Analytics" />
          <NavItem to="/conversations" icon="forum" label="Conversations" />
          <NavItem to="/builder" icon="smart_toy" label="Agent Builder" />
        </nav>
      </div>

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