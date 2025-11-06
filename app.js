const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from the public directory
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/agent-builder', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'agentBuilder.html'));
});
app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'agentHomepage.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'agentDashboard.html'));
});
app.get('/agent-conversation', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'agentConversation.html'));
});





app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});


