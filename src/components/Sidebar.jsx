import React from 'react';
import { NavLink } from 'react-router-dom';

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

          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  )
}