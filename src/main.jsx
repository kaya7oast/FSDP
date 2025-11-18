import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AgentDashboard from './components/agentDashboard.jsx'
import AgentHomepage from './components/AgentHomepage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AgentDashboard />} />    
        <Route path="/AgentHomepage" element={<AgentHomepage />} /> 
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)