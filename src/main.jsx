import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import Layout from './components/Layout';
import AgentDashboard from './components/agentDashboard';
import AgentBuilder from './components/agentBuilder';
import AgentConversation from './components/agentConversation.jsx/page';
import AgentAnalytics from './components/agentAnalytics';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AgentDashboard />} />
          <Route path="/analytics" element={<AgentAnalytics />} />
          <Route path="/conversations" element={<AgentConversation />} />
          <Route path="/builder" element={<AgentBuilder />} />
          <Route path="/builder/:agentId" element={<AgentBuilder />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);