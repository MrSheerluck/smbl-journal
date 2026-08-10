import { env } from '$env/dynamic/public';

const API_URL = env.PUBLIC_API_URL || 'http://localhost:8080';

export async function joinWaitlist(email: string) {
	let res: Response;
	try {
		res = await fetch(`${API_URL}/api/waitlist`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email })
		});
	} catch {
		throw new Error('Network error — check your connection and try again');
	}

	if (!res.ok) {
		const message = await res.json().catch(() => null);
		throw new Error(message?.error ?? 'Failed to submit — please try again');
	}
}
