import { argon2id } from '@noble/hashes/argon2';
import { randomBytes } from '@noble/hashes/utils';

export interface KdfParams {
	iterations: number;
	memory: number;
	parallelism: number;
}

export const DEFAULT_KDF: KdfParams = {
	iterations: 3,
	memory: 65536,
	parallelism: 1
};

const aes = crypto.subtle;

type Bytes = Uint8Array<ArrayBuffer>;

function asAB(u8: Uint8Array): Bytes {
	return u8 as Bytes;
}

export function generateVaultKey(): Bytes {
	return asAB(randomBytes(32));
}

export async function deriveKey(
	passphrase: string,
	salt: Uint8Array,
	params: KdfParams = DEFAULT_KDF
): Promise<Bytes> {
	return asAB(argon2id(new TextEncoder().encode(passphrase), salt, {
		t: params.iterations,
		m: params.memory,
		p: params.parallelism,
		dkLen: 32
	}));
}

export async function wrapVaultKey(
	vaultKey: Uint8Array,
	derivedKey: Uint8Array
): Promise<{ iv: Bytes; ciphertext: Bytes }> {
	const iv = asAB(crypto.getRandomValues(new Uint8Array(12)));
	const encrypted = await aes.encrypt(
		{ name: 'AES-GCM', iv },
		await aes.importKey('raw', asAB(derivedKey), 'AES-GCM', false, ['encrypt']),
		asAB(vaultKey)
	);
	return { iv, ciphertext: new Uint8Array(encrypted) };
}

export async function unwrapVaultKey(
	derivedKey: Uint8Array,
	iv: Uint8Array,
	ciphertext: Uint8Array
): Promise<Bytes> {
	const decrypted = await aes.decrypt(
		{ name: 'AES-GCM', iv: asAB(iv) },
		await aes.importKey('raw', asAB(derivedKey), 'AES-GCM', false, ['decrypt']),
		asAB(ciphertext)
	);
	return new Uint8Array(decrypted);
}
