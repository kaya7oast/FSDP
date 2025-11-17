import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/agentHomepage.css';   // <- import from public root
import './index.css';

ReactDOM.createRoot(document.getElementById('app')).render(<App />);