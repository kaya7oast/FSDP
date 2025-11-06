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
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "full": "9999px"
      },
    },
  },
};

// Update background color based on initial page mode
addEventListener("DOMContentLoaded", function() {
  // keep tailwind background in sync with page mode
  tailwind.config.theme.extend.colors["background"] =
    document.documentElement.classList.contains("dark")
      ? tailwind.config.theme.extend.colors["background-dark"]
      : tailwind.config.theme.extend.colors["background-light"];
});

// Smooth scrolling for agent builder nav links
document.addEventListener("DOMContentLoaded", function () {
  // hook General nav button to scroll behavior
  const navGeneral = document.getElementById("nav-general");
  if (navGeneral) {
    navGeneral.addEventListener("click", function (ev) {
      ev.preventDefault();
      const section = document.getElementById("general-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  // hook Personality nav button to scroll behavior
  const navPersonality = document.getElementById("nav-personality");
  if (navPersonality) {
    navPersonality.addEventListener("click", function (ev) {
      ev.preventDefault();
      const section = document.getElementById("personality-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // hook Capabilities nav button to scroll behavior
  const navCapabilities = document.getElementById("nav-capabilities");
  if (navCapabilities) {
    navCapabilities.addEventListener("click", function (ev) {
      ev.preventDefault();
      const section = document.getElementById("capabilities-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // hook Integrations nav button to scroll behavior
  const navIntegrations = document.getElementById("nav-integrations");
  if (navIntegrations) {
    navIntegrations.addEventListener("click", function (ev) {
      ev.preventDefault();
      const section = document.getElementById("integrations-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
});