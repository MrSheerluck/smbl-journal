import { test } from 'node:test';
import assert from 'node:assert';
import {
	generateVaultKey,
	deriveKey,
	wrapVaultKey,
	unwrapVaultKey,
	DEFAULT_KDF
} from './crypto.ts';

test('wrap → unwrap returns the original vault key', async () => {
	const passphrase = 'correct horse battery staple';
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derived = await deriveKey(passphrase, salt, DEFAULT_KDF);
	const vaultKey = generateVaultKey();
	const { iv, ciphertext } = await wrapVaultKey(vaultKey, derived);
	const recovered = await unwrapVaultKey(derived, iv, ciphertext);
	assert.deepEqual(recovered, vaultKey);
});

test('wrong passphrase fails to unwrap', async () => {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derived = await deriveKey('right passphrase', salt, DEFAULT_KDF);
	const wrong = await deriveKey('wrong passphrase', salt, DEFAULT_KDF);
	const { iv, ciphertext } = await wrapVaultKey(generateVaultKey(), derived);
	await assert.rejects(() => unwrapVaultKey(wrong, iv, ciphertext));
});
