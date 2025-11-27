import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// 1. Import AuthProvider
import { AuthProvider } from './context/AuthContext'

// 2. Import your new components from the accounts folder
import Login from './components/accounts/login.jsx'
import AccountPage from './components/accounts/accountPage.jsx'
import UserDirectory from './components/accounts/userDirectory.jsx'

// Existing Imports
import AgentHomepage from './components/AgentHomepage'
import AgentConversation from './components/agentConversation.jsx/page.jsx'
import AgentDashboard from './components/agentDashboard'
import AgentBuilder from './components/agentBuilder'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> {/* Wrap everything in AuthProvider */}
      <BrowserRouter>
        <Routes>
          {/* New Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/community" element={<UserDirectory />} />
          
          {/* Existing Routes */}
          <Route path="/" element={<AgentHomepage />} />
          <Route path="/conversations" element={<AgentConversation />} />
          <Route path="/dashboard" element={<AgentDashboard />} />
          <Route path="/builder" element={<AgentBuilder />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)