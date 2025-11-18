import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme-preference';

function getInitialTheme(): Theme {
	if (!browser) return 'system';
	
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') {
		return stored as Theme;
	}
	return 'system';
}

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
	if (theme === 'system') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return theme;
}

function applyTheme(theme: 'light' | 'dark') {
	if (!browser) return;
	
	const html = document.documentElement;
	if (theme === 'dark') {
		html.classList.add('dark');
	} else {
		html.classList.remove('dark');
	}
	
	// Update theme-color meta tag
	const metaThemeColor = document.querySelector('meta[name="theme-color"]');
	if (metaThemeColor) {
		metaThemeColor.setAttribute('content', theme === 'dark' ? '#43b1a6' : '#3c9f95');
	}
}

function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>(getInitialTheme());

	return {
		subscribe,
		set: (theme: Theme) => {
			if (browser) {
				localStorage.setItem(THEME_STORAGE_KEY, theme);
			}
			set(theme);
			applyTheme(getEffectiveTheme(theme));
		},
		init: (): (() => void) | null => {
			if (!browser) return null;
			
			const initialTheme = getInitialTheme();
			applyTheme(getEffectiveTheme(initialTheme));
			
			// Listen for system theme changes when in system mode
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleSystemThemeChange = () => {
				update((currentTheme) => {
					if (currentTheme === 'system') {
						applyTheme(getEffectiveTheme('system'));
					}
					return currentTheme;
				});
			};
			mediaQuery.addEventListener('change', handleSystemThemeChange);
			
			return () => {
				mediaQuery.removeEventListener('change', handleSystemThemeChange);
			};
		}
	};
}

export const theme = createThemeStore();

