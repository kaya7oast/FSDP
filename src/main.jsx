import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AgentHomepage from './components/AgentHomepage.jsx'
import AgentConversation from './components/agentConversation.jsx/page.jsx'
import AgentDashboard from './components/agentDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AgentHomepage />} />
        <Route path="/conversations" element={<AgentConversation />} />
        <Route path="/dashboard" element={<AgentDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)