import {
	deriveKey,
	generateVaultKey,
	wrapVaultKey,
	DEFAULT_KDF
} from '@smbl/shared';
import { saveVault } from './api';

const VAULT_KEY = 'smbl.vaultKey';

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

	// Cache the raw key locally (no re-prompt this session).
	sessionStorage.setItem(VAULT_KEY, bytesToBase64(vaultKey));

	// Persist only the wrapped key + non-secret params via the BFF.
	await saveVault({
		wrapped: bytesToBase64(ciphertext),
		iv: bytesToBase64(iv),
		salt: bytesToBase64(salt),
		params: DEFAULT_KDF
	});
}

export function getVaultKey(): Uint8Array | null {
	const raw = sessionStorage.getItem(VAULT_KEY);
	return raw ? base64ToBytes(raw) : null;
}

export function clearVault(): void {
	sessionStorage.removeItem(VAULT_KEY);
}
