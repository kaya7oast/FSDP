import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AgentHomepage from './components/AgentHomepage';
import AgentBuilder from './pages/AgentBuilder';
import AgentConversation from './pages/AgentConversation';
import AgentDashboard from './pages/AgentDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AgentHomepage />} />
        <Route path="/agentBuilder" element={<AgentBuilder />} />
        <Route path="/agentConversation" element={<AgentConversation />} />
        <Route path="/agentDashboard" element={<AgentDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;