import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// 1. Import AuthProvider
import { AuthProvider } from './context/AuthContext'

// 2. Import New Account Components
import Login from './components/accounts/login.jsx'
import AccountPage from './components/accounts/accountPage.jsx'
import UserDirectory from './components/accounts/userDirectory.jsx'

// Existing Components
import AgentHomepage from './components/AgentHomepage.jsx'
import AgentConversation from './components/agentConversation.jsx/page.jsx'
import AgentDashboard from './components/agentDashboard.jsx'
import AgentBuilder from './components/agentBuilder.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider> {/* Wrap everything so Auth works everywhere */}
      <BrowserRouter>
        <Routes>
          {/* --- New Account Routes --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/community" element={<UserDirectory />} />
          
          {/* --- Existing Agent Routes --- */}
          <Route path="/" element={<AgentHomepage />} />
          <Route path="/conversations" element={<AgentConversation />} />
          <Route path="/dashboard" element={<AgentDashboard />} />
          <Route path="/builder" element={<AgentBuilder />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)