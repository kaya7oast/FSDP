window.tailwind = window.tailwind || {};
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#4A90E2",
                "background-light": "#F7F9FC",
                "background-dark": "#101922",
                "text-light": "#333333",
                "text-dark": "#F7F9FC",
                "border-light": "#E0E0E0",
                "border-dark": "#2a3642",
                "success": "#28A745",
                "inactive": "#6C757D",
                "danger": "#DC3545",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "0.75rem",
                "xl": "1rem",
                "full": "9999px"
            },
        },
    },
};