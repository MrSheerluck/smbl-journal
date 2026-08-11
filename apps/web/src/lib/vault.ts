import {
	deriveKey,
	generateVaultKey,
	wrapVaultKey,
	DEFAULT_KDF,
	type KdfParams
} from '@smbl/shared';

const VAULT_KEY = 'smbl.vaultKey';
const VAULT_META = 'smbl.vault';

export interface StoredVault {
	wrapped: string; // base64 vault key ciphertext
	iv: string;      // base64 AES-GCM IV
	salt: string;    // base64 Argon2id salt
	params: KdfParams;
}

function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

export async function createVault(passphrase: string): Promise<void> {
	const vaultKey = generateVaultKey();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derived = await deriveKey(passphrase, salt, DEFAULT_KDF);
	const { iv, ciphertext } = await wrapVaultKey(vaultKey, derived);

	sessionStorage.setItem(VAULT_KEY, bytesToBase64(vaultKey));
	sessionStorage.setItem(
		VAULT_META,
		JSON.stringify({
			wrapped: bytesToBase64(ciphertext),
			iv: bytesToBase64(iv),
			salt: bytesToBase64(salt),
			params: DEFAULT_KDF
		} as StoredVault)
	);
}

export function getVaultKey(): Uint8Array | null {
	const raw = sessionStorage.getItem(VAULT_KEY);
	return raw ? base64ToBytes(raw) : null;
}

export function hasVault(): boolean {
	return sessionStorage.getItem(VAULT_META) !== null;
}

export function clearVault(): void {
	sessionStorage.removeItem(VAULT_KEY);
	sessionStorage.removeItem(VAULT_META);
}
