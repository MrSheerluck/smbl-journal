<script lang="ts">
	import { joinWaitlist } from '$lib/waitlist';

	let email = $state('');
	let status: 'idle' | 'sending' | 'success' | 'error' = $state('idle');
	let errorMsg = $state('');

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	async function handleSubmit() {
		const trimmedEmail = email.trim();
		if (!EMAIL_RE.test(trimmedEmail)) {
			status = 'error';
			errorMsg = 'Enter a valid email';
			return;
		}

		status = 'sending';
		errorMsg = '';

		try {
			await joinWaitlist(trimmedEmail);
			status = 'success';
			email = '';
		} catch {
			status = 'error';
			errorMsg = 'Failed to submit';
		}
	}
</script>

<form
	class="mt-2 flex w-full max-w-sm flex-col gap-2"
	novalidate
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<div class="flex gap-2">
		<input
			type="email"
			bind:value={email}
			placeholder="you@example.com"
			disabled={status === 'sending'}
			class="w-full rounded-full border border-rule bg-paper-2 px-4 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft focus:border-ink-soft dark:border-[#2c2c2c] dark:bg-[#1b1b1b] dark:text-[#f2f2f2] dark:focus:border-thread-soft"
		/>
		<button
			type="submit"
			disabled={status === 'sending'}
			class="shrink-0 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition enabled:hover:bg-ink-2 disabled:opacity-50"
		>
			{status === 'sending' ? 'Joining…' : 'Join the waitlist'}
		</button>
	</div>

	<p class="text-sm" aria-live="polite">
		{#if status === 'error'}
			<span class="text-red-600">{errorMsg}</span>
		{:else if status === 'success'}
			<span class="text-emerald-600">You're on the list. We'll email you when it's live.</span>
		{/if}
	</p>
</form>
