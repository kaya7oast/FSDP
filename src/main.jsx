import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AgentDashboard from './components/agentDashboard.jsx'
import AgentHomepage from './components/AgentHomepage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AgentHomepage />} />
        <Route path="/dashboard" element={<AgentDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} /> {/* fallback */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)