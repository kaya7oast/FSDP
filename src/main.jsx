import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {BrowserRouter} from 'react-router-dom'
import AgentDashboard from './agentDashboard.jsx'
import AgentHomepage from './components/AgentHomepage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AgentDashboard />
      <AgentHomepage />
    </BrowserRouter>
  </StrictMode>,
)