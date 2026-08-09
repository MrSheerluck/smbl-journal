export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

const browser = typeof window !== 'undefined';

const media = browser ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function apply(theme: Theme) {
	if (!browser) return;
	const dark = theme === 'dark' || (theme === 'system' && media?.matches === true);
	document.documentElement.classList.toggle('dark', dark);
}

const stored: Theme | null = browser
	? (localStorage.getItem(STORAGE_KEY) as Theme)
	: null;

export const theme = (() => {
	let current: Theme = $state(stored ?? 'system');

	media?.addEventListener('change', () => {
		if (current === 'system') apply('system');
	});

	return {
		get value() {
			return current;
		},
		set value(t: Theme) {
			current = t;
			if (browser) localStorage.setItem(STORAGE_KEY, t);
			apply(t);
		}
	};
})();
