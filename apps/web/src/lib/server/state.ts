const STATE_PREFIX = 'smbl.state';

/** FNV-1a 32-bit hash, hex-padded to 8 chars (mirrors WorkOS's own SDK). */
function shortHash(input: string): string {
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash.toString(16).padStart(8, '0');
}

export function stateCookieName(state: string): string {
	return `${STATE_PREFIX}-${shortHash(state)}`;
}

export function nonce(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	let s = '';
	for (const b of bytes) s += String.fromCharCode(b);
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
