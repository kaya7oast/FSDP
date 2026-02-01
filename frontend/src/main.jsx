import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import Layout from './components/Layout';
import AgentDashboard from './components/agentDashboard';
import AgentBuilder from './components/agentBuilder';
import AgentConversation from './components/agentConversation.jsx/page';
import PopularityPage from './components/Popularity.jsx'; 
import LoginPage from './components/login.jsx';
import SignupPage from './components/signup.jsx';
import VisualisationPage from './components/Visualisation.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<AgentDashboard />} />
          
          <Route path="/popularity" element={<PopularityPage />} /> 
          <Route path="/visualisation" element={<VisualisationPage />} />
          <Route path="/chats" element={<AgentConversation />} />
          <Route path="/builder" element={<AgentBuilder />} />
          <Route path="/builder/:agentId" element={<AgentBuilder />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);