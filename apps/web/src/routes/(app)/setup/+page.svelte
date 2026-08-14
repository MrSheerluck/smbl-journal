<script lang="ts">
	import { createVault } from '$lib/vault';

	let passphrase = $state('');
	let confirm = $state('');
	let open = $state(false);
	let submitting = $state(false);
	let error = $state('');

	let strength = $derived(scorePassphrase(passphrase));
	let mismatched = $derived(passphrase.length > 0 && confirm !== passphrase);
	let canSubmit = $derived(passphrase.length > 0 && !mismatched);

	async function handleSubmit() {
		if (!canSubmit || submitting) return;
		submitting = true;
		error = '';
		try {
			await createVault(passphrase);
			window.location.href = '/home';
		} catch (e) {
			error = 'Something went wrong creating your vault. Please try again.';
			submitting = false;
		}
	}

	function scorePassphrase(p: string): number {
		let s = 0;
		if (p.length >= 12) s += 2;
		else if (p.length >= 8) s += 1;
		if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s += 1;
		if (/\d/.test(p)) s += 1;
		if (/[^a-zA-Z0-9]/.test(p)) s += 1;
		return Math.min(s, 4);
	}

	const labels = ['weak', 'ok', 'strong', 'strong'];
	const colors = ['bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'];
</script>

<main
	class="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16 text-ink dark:text-[#f2f2f2]"
>
	<header class="flex flex-col gap-1">
		<p class="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">set up your vault</p>
		<h1 class="font-display text-4xl font-medium leading-tight">create a passphrase</h1>
		<p class="text-sm text-ink-soft">This unlocks your private journal. Choose it carefully.</p>
	</header>

	<details bind:open={open} class="group text-sm text-ink-soft dark:text-ink-soft">
		<summary
			class="flex cursor-pointer list-none flex-wrap items-center gap-x-1.5 [&::-webkit-details-marker]:hidden"
		>
			<span>
				Your journal is end-to-end encrypted. Only this passphrase can ever unlock it, and if you
				lose it, your journal cannot be recovered, ever.
			</span>
			<span
				class="text-xs font-medium text-ink-soft underline decoration-dotted underline-offset-2 group-open:text-ink dark:group-open:text-[#f2f2f2]"
			>
				{open ? 'Show less' : 'Learn more'}
			</span>
		</summary>
		<div class="mt-2 space-y-1.5 border-l border-rule pl-4 text-xs text-ink-soft dark:border-[#2c2c2c]">
			<p>
				Your entries are encrypted before they leave this browser, with a randomly generated
				vault key (AES-256-GCM). We only ever store the encrypted ciphertext, so even we cannot
				read your journal.
			</p>
			<p>
				That vault key is itself locked, or wrapped, by a key derived from your passphrase via
				Argon2id, right here in your browser. Neither your passphrase nor your vault key ever
				reach our servers.
			</p>
			<p>
				Because only you hold the passphrase, it is the single point of access to your entries.
				If you lose it, there is no reset and no recovery: your journal is permanently gone.
				Write it down somewhere safe.
			</p>
		</div>
	</details>

	<form class="flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<label class="flex flex-col gap-1.5 text-sm">
			<span class="font-medium text-ink-soft">Passphrase</span>
			<input
				bind:value={passphrase}
				type="password"
				autocomplete="new-password"
				class="rounded-lg border border-rule bg-transparent px-3 py-2.5 outline-none transition focus:border-ink-soft dark:border-[#2c2c2c] dark:focus:border-thread-soft"
			/>
		</label>

		{#if passphrase.length > 0}
			<div class="flex items-center gap-2">
				<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-rule dark:bg-[#232323]">
					<div
						class="h-full rounded-full transition-all duration-200 {colors[strength]}"
						style:width={`${((strength + 1) / 4) * 100}%`}
					></div>
				</div>
				<span class="w-10 text-right text-xs capitalize text-ink-soft">{labels[strength]}</span>
			</div>
		{/if}

		<label class="flex flex-col gap-1.5 text-sm">
			<span class="font-medium text-ink-soft">Confirm passphrase</span>
			<input
				bind:value={confirm}
				type="password"
				autocomplete="new-password"
				class="rounded-lg border border-rule bg-transparent px-3 py-2.5 outline-none transition focus:border-ink-soft dark:border-[#2c2c2c] dark:focus:border-thread-soft"
			/>
		</label>

		{#if mismatched}
			<p class="text-xs text-red-500">Passphrases don't match</p>
		{/if}

		{#if error}
			<p class="text-xs text-red-500">{error}</p>
		{/if}

		<button
			type="submit"
			disabled={!canSubmit || submitting}
			class="mt-2 rounded-lg bg-ink px-4 py-2.5 font-medium text-paper transition hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#f2f2f2] dark:text-[#141414] dark:hover:bg-paper-2"
		>
			{submitting ? 'Creating...' : 'Create vault'}
		</button>
	</form>
</main>
