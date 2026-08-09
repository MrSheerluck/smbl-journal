const API_URL = 'http://localhost:8080';

export async function joinWaitlist(email: string) {
	const res = await fetch(`${API_URL}/api/waitlist`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email })
	});
	if (!res.ok) throw new Error('Failed to submit');
}
