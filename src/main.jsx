import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './index.css';

import Layout from './components/Layout';
import AgentDashboard from './components/agentDashboard';
import AgentBuilder from './components/agentBuilder';
import AgentConversation from './components/agentConversation.jsx/page';
import AgentAnalytics from './components/agentAnalytics';
import LoginPage from './components/login.jsx';
import SignupPage from './components/signup.jsx';

/* ✅ SINGLE source of truth */
const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role'); // MUST match login.jsx

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* User + Admin */}
        <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<AgentDashboard />} />
            <Route path="/analytics" element={<AgentAnalytics />} />
            <Route path="/chats" element={<AgentConversation />} />
            <Route path="/builder" element={<AgentBuilder />} />
            <Route path="/builder/:agentId" element={<AgentBuilder />} />
          </Route>
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}> {/*route for admin only*/}
          <Route element={<Layout />}>
            
          </Route>
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  </StrictMode>
);
