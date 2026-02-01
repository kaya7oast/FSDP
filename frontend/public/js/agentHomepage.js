 
alert('agentHomepage.js loaded');
window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#137fec",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
};
document.addEventListener('click', (e) => {
  const target = e.target.closest && e.target.closest('.myagent');
  if (target) {
    window.location.href = '/dashboard';
  }
});
document.addEventListener('click', (e) => {
  const target = e.target.closest && e.target.closest('.conversation');
  if (target) {
    window.location.href = '/agent-conversation';
  }
});
document.addEventListener('click', (e) => {
  const target = e.target.closest && e.target.closest('.setting');
  if (target) {
    window.location.href = '/agent-builder';
  }
});