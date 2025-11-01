const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from the public directory
app.use(express.static(path.join(__dirname, 'public')));


app.get('/agent-builder', (req, res) => {
	res.sendFile(path.join(__dirname, 'agentBuilder.html'));
});
app.get('/homepage', (req, res) => {
    res.sendFile(path.join(__dirname, 'agentHomepage.html'));
});
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'agentDashboard.html'));
});
app.get('/agent-conversation', (req, res) => {
    res.sendFile(path.join(__dirname, 'agentConversation.html'));
});





app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});


