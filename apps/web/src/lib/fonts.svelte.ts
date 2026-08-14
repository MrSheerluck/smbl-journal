export type FontKey = 'journal' | 'classic' | 'typewriter' | 'handwritten';

export interface FontPreset {
	label: string;
	display: string;
	serif: string;
	mono: string;
}

export const FONT_PRESETS: Record<FontKey, FontPreset> = {
	journal: {
		label: 'Journal',
		display: "'Piazzolla', Georgia, serif",
		serif: "'Newsreader', Georgia, serif",
		mono: "'Special Elite', 'Courier New', monospace"
	},
	classic: {
		label: 'Classic',
		display: "'Cormorant Garamond', Georgia, serif",
		serif: "'Source Serif 4', Georgia, serif",
		mono: "'IBM Plex Mono', ui-monospace, monospace"
	},
	typewriter: {
		label: 'Typewriter',
		display: "'Cormorant Garamond', Georgia, serif",
		serif: "'Courier Prime', 'Courier New', monospace",
		mono: "'Special Elite', 'Courier New', monospace"
	},
	handwritten: {
		label: 'Handwritten',
		display: "'Caveat', cursive",
		serif: "'Kalam', 'Comic Sans MS', cursive",
		mono: "'Special Elite', 'Courier New', monospace"
	}
};

const STORAGE_KEY = 'font';

const browser = typeof window !== 'undefined';

export function applyFont(key: FontKey): void {
	if (!browser) return;
	const p = FONT_PRESETS[key];
	const el = document.documentElement;
	el.style.setProperty('--font-display', p.display);
	el.style.setProperty('--font-serif', p.serif);
	el.style.setProperty('--font-mono', p.mono);
}

export const font = (() => {
	const stored: FontKey | null = browser
		? (localStorage.getItem(STORAGE_KEY) as FontKey)
		: null;
	let current: FontKey = $state(stored && FONT_PRESETS[stored] ? stored : 'journal');

	if (browser) applyFont(current);

	return {
		get value() {
			return current;
		},
		set value(k: FontKey) {
			current = k;
			if (browser) localStorage.setItem(STORAGE_KEY, k);
			applyFont(k);
		}
	};
})();
