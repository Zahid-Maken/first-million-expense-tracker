interface ThemeOption {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundTexture?: string;
  backgroundGradient?: string;
  cardStyle?: string;
  buttonStyle?: string;
  fontStyle?: string;
}

// Define the themes
export const themeOptions: ThemeOption[] = [
  // Default theme (current state)
  {
    id: "default",
    name: "Default",
    description: "Clean and modern financial interface",
    isPremium: false,
    primaryColor: "hsl(262, 89%, 58%)", // --primary: 262 89% 58%
    secondaryColor: "hsl(158, 78%, 48%)", // --secondary: 158 78% 48%
    accentColor: "hsl(25, 95%, 62%)", // --accent: 25 95% 62%
    backgroundGradient: "none",
    cardStyle: "rounded-xl border border-border bg-card shadow-sm",
    buttonStyle: "bg-primary text-primary-foreground hover:bg-primary/90",
    fontStyle: "'Plus Jakarta Sans', system-ui, sans-serif"
  },
  
  // Premium Theme 1: Nebula
  {
    id: "nebula",
    name: "Nebula",
    description: "Cosmic gradients with deep space textures",
    isPremium: true,
    primaryColor: "hsl(280, 90%, 50%)",
    secondaryColor: "hsl(190, 95%, 45%)",
    accentColor: "hsl(330, 100%, 65%)",
    backgroundTexture: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMDAwMDIwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMyMDIwNjAiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')",
    backgroundGradient: "linear-gradient(135deg, rgba(20, 10, 40, 0.95) 0%, rgba(35, 15, 70, 0.95) 100%)",
    cardStyle: "rounded-xl border border-purple-800/30 bg-purple-900/20 backdrop-blur-md shadow-[0_8px_30px_rgba(76,29,149,0.1)]",
    buttonStyle: "bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 shadow-lg shadow-purple-500/20",
    fontStyle: "'Plus Jakarta Sans', system-ui, sans-serif"
  },
  
  // Premium Theme 2: Emerald
  {
    id: "emerald",
    name: "Emerald",
    description: "Luxurious geometric patterns with emerald accents",
    isPremium: true,
    primaryColor: "hsl(150, 80%, 35%)",
    secondaryColor: "hsl(170, 75%, 40%)",
    accentColor: "hsl(130, 90%, 45%)",
    backgroundTexture: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+CjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0iIzEwMjYyMCI+PC9yZWN0Pgo8cmVjdCB4PSIyNSIgeT0iMjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iIzE0MzAyOCI+PC9yZWN0Pgo8cmVjdCB4PSIwIiB5PSIyNSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjMTgzYTMwIj48L3JlY3Q+CjxyZWN0IHg9IjEyLjUiIHk9IjEyLjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0idHJhbnNwYXJlbnQiIHN0cm9rZT0iIzFhNTAzMCIgc3Ryb2tlLXdpZHRoPSIxIj48L3JlY3Q+Cjwvc3ZnPg==')",
    backgroundGradient: "linear-gradient(135deg, rgba(10, 30, 20, 0.97) 0%, rgba(15, 40, 30, 0.97) 100%)",
    cardStyle: "rounded-xl border border-green-800/30 bg-green-900/10 backdrop-blur-md shadow-[0_8px_30px_rgba(16,185,129,0.1)]",
    buttonStyle: "bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-700 hover:to-emerald-600 shadow-lg shadow-green-500/20",
    fontStyle: "'Plus Jakarta Sans', system-ui, sans-serif"
  },
  
  // Premium Theme 3: Royal Gold
  {
    id: "royal-gold",
    name: "Royal Gold",
    description: "Elegant gold patterns with royal aesthetic",
    isPremium: true,
    primaryColor: "hsl(45, 90%, 50%)",
    secondaryColor: "hsl(30, 80%, 45%)",
    accentColor: "hsl(15, 85%, 55%)",
    backgroundTexture: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIwMTgxMCI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSI4IiBmaWxsPSJ0cmFuc3BhcmVudCIgc3Ryb2tlPSIjNTAzMDEwIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC44Ij48L2NpcmNsZT4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iNCIgZmlsbD0idHJhbnNwYXJlbnQiIHN0cm9rZT0iIzcwNDgxMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuOCI+PC9jaXJjbGU+Cjwvc3ZnPg==')",
    backgroundGradient: "linear-gradient(135deg, rgba(30, 20, 10, 0.97) 0%, rgba(40, 25, 10, 0.97) 100%)",
    cardStyle: "rounded-xl border border-yellow-800/30 bg-amber-900/10 backdrop-blur-md shadow-[0_8px_30px_rgba(217,119,6,0.1)]",
    buttonStyle: "bg-gradient-to-r from-amber-500 to-yellow-400 text-white hover:from-amber-600 hover:to-yellow-500 shadow-lg shadow-amber-500/20",
    fontStyle: "'Playfair Display', 'Plus Jakarta Sans', serif"
  },
  
  // Premium Theme 4: Neon Cyberpunk
  {
    id: "neon-cyberpunk",
    name: "Neon Cyberpunk",
    description: "Futuristic neon grid with cyberpunk vibes",
    isPremium: true,
    primaryColor: "hsl(330, 100%, 50%)",
    secondaryColor: "hsl(210, 100%, 50%)",
    accentColor: "hsl(150, 100%, 50%)",
    backgroundTexture: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzA4MDgxMiI+PC9yZWN0Pgo8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIwMjA0MCIgc3Ryb2tlLXdpZHRoPSIxIj48L3JlY3Q+CjxyZWN0IHg9IjIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzIwMjA0MCIgc3Ryb2tlLXdpZHRoPSIwLjUiPjwvcmVjdD4KPHJlY3QgeD0iMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjAyMDQwIiBzdHJva2Utd2lkdGg9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')",
    backgroundGradient: "linear-gradient(135deg, rgba(10, 10, 25, 0.97) 0%, rgba(20, 10, 35, 0.97) 100%)",
    cardStyle: "rounded-xl border border-pink-700/30 bg-pink-900/10 backdrop-blur-md shadow-[0_8px_30px_rgba(236,72,153,0.1)]",
    buttonStyle: "bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 shadow-lg shadow-pink-500/20",
    fontStyle: "'Plus Jakarta Sans', system-ui, sans-serif"
  }
];

// Function to apply a theme to the document
export function applyTheme(themeId: string): void {
  const theme = themeOptions.find(t => t.id === themeId) || themeOptions[0];
  
  // Store the selected theme ID in localStorage
  localStorage.setItem("selectedTheme", themeId);
  
  // Apply dark mode if needed (for all themes except default which follows system/user preference)
  if (themeId !== "default") {
    document.documentElement.classList.add("dark");
  } else {
    // For default theme, respect the mode setting (light/dark/system)
    const mode = localStorage.getItem("themeMode") || "system";
    if (mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
  
  // Apply theme CSS variables
  document.documentElement.style.setProperty("--theme-primary", theme.primaryColor);
  document.documentElement.style.setProperty("--theme-secondary", theme.secondaryColor);
  document.documentElement.style.setProperty("--theme-accent", theme.accentColor);
  
  // Apply background texture and gradient
  if (theme.backgroundTexture) {
    document.body.style.backgroundImage = `${theme.backgroundTexture}`;
  } else {
    document.body.style.backgroundImage = "none";
  }
  
  if (theme.backgroundGradient && theme.backgroundGradient !== "none") {
    document.body.style.background = theme.backgroundGradient;
  }
  
  // Add a theme class to the body for additional styling
  document.body.className = document.body.className.replace(/theme-\w+/g, "").trim();
  document.body.classList.add(`theme-${theme.id}`);
  
  // Apply theme-specific font
  if (theme.fontStyle) {
    document.documentElement.style.fontFamily = theme.fontStyle;
  }
  
  // For Cyberpunk theme, add data-text attributes to headings for the glow effect
  if (themeId === "neon-cyberpunk") {
    addCyberpunkTextEffects();
  }
}

// Helper function to add cyberpunk text glow effects
function addCyberpunkTextEffects(): void {
  setTimeout(() => {
    const headings = document.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
      if (!heading.hasAttribute('data-text')) {
        heading.setAttribute('data-text', heading.textContent || '');
      }
    });
  }, 100);
}

// Initialize theme on load
export function initializeTheme(): void {
  const savedThemeId = localStorage.getItem("selectedTheme") || "default";
  applyTheme(savedThemeId);
}

// Get current theme
export function getCurrentTheme(): ThemeOption {
  const themeId = localStorage.getItem("selectedTheme") || "default";
  return themeOptions.find(t => t.id === themeId) || themeOptions[0];
} 