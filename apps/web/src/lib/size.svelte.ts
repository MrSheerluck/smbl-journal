export type SizeLevel = 'small' | 'medium' | 'large';

const UI_SCALES: Record<SizeLevel, number> = { small: 0.9, medium: 1, large: 1.1 };
const ENTRY_SCALES: Record<SizeLevel, number> = { small: 0.85, medium: 1, large: 1.2 };

const STORAGE_KEY = 'size';

const browser = typeof window !== 'undefined';

function readStored(): { ui: SizeLevel; entry: SizeLevel } {
	if (!browser) return { ui: 'medium', entry: 'medium' };
	try {
		const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
		const pick = (v: unknown, fallback: SizeLevel): SizeLevel =>
			v === 'small' || v === 'large' ? v : v === 'medium' ? 'medium' : fallback;
		return { ui: pick(p.ui, 'medium'), entry: pick(p.entry, 'medium') };
	} catch {
		return { ui: 'medium', entry: 'medium' };
	}
}

export function applySize(ui: SizeLevel, entry: SizeLevel): void {
	if (!browser) return;
	const el = document.documentElement;
	el.style.fontSize = `${UI_SCALES[ui] * 100}%`;
	el.style.setProperty('--entry-scale', String(ENTRY_SCALES[entry]));
}

export const size = (() => {
	const stored = readStored();
	let ui: SizeLevel = $state(stored.ui);
	let entry: SizeLevel = $state(stored.entry);

	function persist() {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ui, entry }));
	}

	applySize(ui, entry);

	return {
		get ui() {
			return ui;
		},
		set ui(v: SizeLevel) {
			ui = v;
			persist();
			applySize(ui, entry);
		},
		get entry() {
			return entry;
		},
		set entry(v: SizeLevel) {
			entry = v;
			persist();
			applySize(ui, entry);
		}
	};
})();
