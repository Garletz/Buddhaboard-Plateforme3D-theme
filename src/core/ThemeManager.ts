import { eventBus } from './EventBus';

export const themes = {
    light: {
        '--color-top': '#FBEBC2',
        '--color-top-light': '#fdf3d7',
        '--color-top-dark': '#f0e0b0',
        '--color-front-top': '#f0dfac',
        '--color-front-mid': '#e6d49e',
        '--color-front-bottom': '#dcc890',
        '--focus-aura-color': 'rgba(251, 235, 194, 0.3)',
        '--card-transition-speed': '0.38s'
    },
    dark: {
        '--color-top': '#2c2e33',
        '--color-top-light': '#3b3e45',
        '--color-top-dark': '#1e2024',
        '--color-front-top': '#24262a',
        '--color-front-mid': '#1d1e22',
        '--color-front-bottom': '#141518',
        '--focus-aura-color': 'rgba(100, 150, 255, 0.2)',
        '--card-transition-speed': '0.38s'
    }
};

export type ThemeName = keyof typeof themes;

class ThemeManager {
    private currentTheme: ThemeName = 'light';

    constructor() {
        // Optionnel : charger le thème préféré depuis le LocalStorage
        this.loadTheme();
    }

    setTheme(themeName: ThemeName) {
        const theme = themes[themeName];
        if (!theme) return;
        
        this.currentTheme = themeName;
        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        
        localStorage.setItem('buddhachannel_theme', themeName);
        eventBus.emit('THEME_CHANGED', { theme: themeName });
    }
    
    setVariable(key: string, value: string) {
        document.documentElement.style.setProperty(key, value);
    }

    toggleTheme() {
        this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
    }

    private loadTheme() {
        if (typeof localStorage === 'undefined') return;
        const saved = localStorage.getItem('buddhachannel_theme') as ThemeName;
        if (saved && themes[saved]) {
            // Un setTimeout court permet d'attendre que le DOM soit bien prêt 
            // si ce script est chargé très tôt dans le <head>
            setTimeout(() => this.setTheme(saved), 0);
        }
    }
}

export const themeManager = new ThemeManager();
