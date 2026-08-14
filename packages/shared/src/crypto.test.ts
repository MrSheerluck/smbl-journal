import { test } from 'node:test';
import assert from 'node:assert';
import {
	generateVaultKey,
	deriveKey,
	wrapVaultKey,
	unwrapVaultKey,
	encryptText,
	decryptText,
	bytesToBase64,
	base64ToBytes,
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


test('encrypt → decrypt text roundtrips', async () => {
	const key = generateVaultKey();
	const { iv, ciphertext } = await encryptText(key, 'hello journal');
	assert.equal(await decryptText(key, iv, ciphertext), 'hello journal');
});

test('decrypt with the wrong key rejects', async () => {
	const key = generateVaultKey();
	const { iv, ciphertext } = await encryptText(key, 'secret');
	await assert.rejects(() => decryptText(generateVaultKey(), iv, ciphertext));
});

test('base64 roundtrips bytes', () => {
	const bytes = new Uint8Array([1, 2, 3, 255]);
	assert.deepEqual(base64ToBytes(bytesToBase64(bytes)), bytes);
});
