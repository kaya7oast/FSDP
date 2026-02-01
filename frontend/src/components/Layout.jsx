import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import VoiceAssistant from './VoiceAssistant'; // Import the new component

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-display transition-colors duration-300">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
        
        {/* Floating Voice Assistant (Bottom Right) */}
        <VoiceAssistant />
      </div>
    </div>
  );
};

export default Layout;