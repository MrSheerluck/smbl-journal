import { writable } from 'svelte/store';
import {
	deriveKey,
	generateVaultKey,
  wrapVaultKey,
  unwrapVaultKey,
	DEFAULT_KDF,
	bytesToBase64,
	base64ToBytes,
	type KdfParams
} from '@smbl/shared';

const VAULT_KEY = 'smbl.vaultKey';
const CHANNEL = 'smbl.vault';

export type VaultStatus = 'locked' | 'unlocked';

export interface VaultPayload {
	wrapped: string;
	iv: string;
	salt: string;
	params: KdfParams;
}

function readStored(): Uint8Array | null {
	if (typeof window === 'undefined') return null;
	const raw = sessionStorage.getItem(VAULT_KEY);
	if (!raw) return null;
	try {
		return base64ToBytes(raw);
	} catch {
		return null;
	}
}

function writeStored(bytes: Uint8Array): void {
	sessionStorage.setItem(VAULT_KEY, bytesToBase64(bytes));
}

export const vaultStatus = writable<VaultStatus>(readStored() ? 'unlocked' : 'locked');

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
	channel = new BroadcastChannel(CHANNEL);
	channel.onmessage = (e) => {
		const data = e.data as { type?: string; value?: string } | null;
		if (data?.type === 'request') {
			const raw = sessionStorage.getItem(VAULT_KEY);
			if (raw) channel?.postMessage({ type: 'key', value: raw });
		} else if (data?.type === 'key' && data.value) {
			sessionStorage.setItem(VAULT_KEY, data.value);
			vaultStatus.set('unlocked');
		}
	};
	if (!readStored()) channel.postMessage({ type: 'request' });
}

async function saveVault(payload: VaultPayload): Promise<void> {
	const res = await fetch('/api/vault', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error('Failed to save vault');
}

export async function createVault(passphrase: string): Promise<void> {
	const vaultKey = generateVaultKey();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derived = await deriveKey(passphrase, salt, DEFAULT_KDF);
	const { iv, ciphertext } = await wrapVaultKey(vaultKey, derived);

	writeStored(vaultKey);
	vaultStatus.set('unlocked');

	await saveVault({
		wrapped: bytesToBase64(ciphertext),
		iv: bytesToBase64(iv),
		salt: bytesToBase64(salt),
		params: DEFAULT_KDF
	});
}


export async function unlockVault(passphrase: string): Promise<boolean> {
	const res = await fetch('/api/vault');
	if (!res.ok) throw new Error('No vault found');
	const data: VaultPayload = await res.json();
	const derived = await deriveKey(passphrase, base64ToBytes(data.salt), data.params);
	try {
		const key = await unwrapVaultKey(derived, base64ToBytes(data.iv), base64ToBytes(data.wrapped));
		writeStored(key);
		vaultStatus.set('unlocked');
		return true;
	} catch {
		return false;
	}
}


export function getVaultKey(): Uint8Array | null {
	return readStored();
}

export function clearVault(): void {
	if (typeof window === 'undefined') return;
	sessionStorage.removeItem(VAULT_KEY);
	vaultStatus.set('locked');
}

export async function changePassphrase(
	currentPassphrase: string,
	newPassphrase: string
): Promise<boolean> {
	const res = await fetch('/api/vault');
	if (!res.ok) throw new Error('No vault found');
	const data: VaultPayload = await res.json();

	const currentDerived = await deriveKey(currentPassphrase, base64ToBytes(data.salt), data.params);
	let vaultKey: Uint8Array;
	try {
		vaultKey = await unwrapVaultKey(
			currentDerived,
			base64ToBytes(data.iv),
			base64ToBytes(data.wrapped)
		);
	} catch {
		return false;
	}

	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derived = await deriveKey(newPassphrase, salt, data.params);
	const { iv, ciphertext } = await wrapVaultKey(vaultKey, derived);

	writeStored(vaultKey);
	vaultStatus.set('unlocked');

	await saveVault({
		wrapped: bytesToBase64(ciphertext),
		iv: bytesToBase64(iv),
		salt: bytesToBase64(salt),
		params: data.params
	});
	return true;
}

export async function resetVault(): Promise<void> {
	const res = await fetch('/api/vault', { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to reset vault');
	clearVault();
}
