import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import Layout from './components/Layout';
import AgentDashboard from './components/agentDashboard';
import AgentBuilder from './components/agentBuilder';
import AgentConversation from './components/agentConversation.jsx/page';
import AgentAnalytics from './components/agentAnalytics';
import LoginPage from './components/login.jsx';
import SignupPage from './components/signup.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. The Entry Point: first page */}
       <Route path="/" element={<AgentDashboard />} />
        {/* 2. Authenticated Routes: Wrapped in the Layout component */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<AgentDashboard />} />
          <Route path="/analytics" element={<AgentAnalytics />} />
          <Route path="/conversations" element={<AgentConversation />} />
          <Route path="/builder" element={<AgentBuilder />} />
          <Route path="/builder/:agentId" element={<AgentBuilder />} />
        </Route>

        {/* 3. The Safety Net: Redirects any undefined URLs back to Login */}
        
      </Routes>
    </BrowserRouter>
  </StrictMode>
);