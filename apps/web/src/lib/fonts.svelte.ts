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

export type EntryFontKey = 'auto' | 'serif' | 'classic' | 'typewriter' | 'handwritten';

export const ENTRY_FONTS: Record<Exclude<EntryFontKey, 'auto'>, string> = {
	serif: "'Newsreader', Georgia, serif",
	classic: "'Source Serif 4', Georgia, serif",
	typewriter: "'Courier Prime', 'Courier New', monospace",
	handwritten: "'Kalam', 'Comic Sans MS', cursive"
};

export const ENTRY_FONT_LABELS: Record<EntryFontKey, string> = {
	auto: 'Default',
	serif: 'Serif',
	classic: 'Classic',
	typewriter: 'Typewriter',
	handwritten: 'Handwritten'
};

const STORAGE_KEY = 'font';
const ENTRY_STORAGE = 'entry-font';

const browser = typeof window !== 'undefined';

export function applyFont(key: FontKey): void {
	if (!browser) return;
	const p = FONT_PRESETS[key];
	const el = document.documentElement;
	el.style.setProperty('--font-display', p.display);
	el.style.setProperty('--font-serif', p.serif);
	el.style.setProperty('--font-mono', p.mono);
}

export function applyEntryFont(key: EntryFontKey): void {
	if (!browser) return;
	const el = document.documentElement;
	if (key === 'auto') {
		el.style.removeProperty('--entry-font');
	} else {
		el.style.setProperty('--entry-font', ENTRY_FONTS[key]);
	}
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

export const entryFont = (() => {
	const stored = browser ? (localStorage.getItem(ENTRY_STORAGE) as EntryFontKey) : null;
	let current: EntryFontKey = $state(stored && stored in ENTRY_FONT_LABELS ? stored : 'auto');

	if (browser) applyEntryFont(current);

	return {
		get value() {
			return current;
		},
		set value(k: EntryFontKey) {
			current = k;
			if (browser) localStorage.setItem(ENTRY_STORAGE, k);
			applyEntryFont(k);
		}
	};
})();
