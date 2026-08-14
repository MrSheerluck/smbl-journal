<script lang="ts">
	import { clearVault, changePassphrase, getVaultKey } from '$lib/vault';
	import { exportPlaintext } from '$lib/entries';
	import { theme, type Theme } from '$lib/theme.svelte';

	const options: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	let current = $state('');
	let next = $state('');
	let confirm = $state('');
	let busy = $state(false);
	let error = $state('');
	let success = $state(false);

	let exporting = $state(false);
	let exportError = $state('');
	let exportLocked = $state(false);

	async function handleExport() {
		if (exporting) return;
		if (!getVaultKey()) {
			exportLocked = true;
			return;
		}
		exporting = true;
		exportError = '';
		exportLocked = false;
		try {
			const text = await exportPlaintext();
			const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `smbl-journal-${new Date().toISOString().slice(0, 10)}.md`;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			exportError = 'Could not export your journal. Try again.';
		} finally {
			exporting = false;
		}
	}

	async function handleChangePassphrase() {
		if (busy) return;
		busy = true;
		error = '';
		success = false;
		try {
			const ok = await changePassphrase(current, next);
			if (ok) {
				success = true;
				current = next = confirm = '';
			} else {
				error = 'Your current passphrase is not right. Try again.';
				current = '';
			}
		} catch {
			error = 'Could not update your passphrase. Try again.';
		} finally {
			busy = false;
		}
	}
</script>

<main class="relative flex min-h-screen w-full flex-col px-6 py-6 sm:px-10">
	<header class="flex items-center justify-between border-b border-rule pb-4 dark:border-rule-dark">
		<p class="eyebrow text-thread">settings</p>
	</header>

	<div class="flex max-w-xl flex-col gap-8 py-8">
		<section class="flex flex-col gap-3">
			<h2 class="font-display text-xl leading-tight">Appearance</h2>
			<div class="flex flex-col gap-2">
				{#each options as option}
					<button
						type="button"
						onclick={() => (theme.value = option.value)}
						class="flex items-center justify-between rounded-xl border border-rule px-4 py-3 text-sm transition hover:border-ink-soft dark:border-rule-dark dark:hover:border-[#4a4b44]"
						class:border-thread={theme.value === option.value}
						class:dark:border-thread-soft={theme.value === option.value}
					>
						<span>{option.label}</span>
						{#if theme.value === option.value}
							<span class="text-thread">&check;</span>
						{/if}
					</button>
				{/each}
			</div>
		</section>

		<section class="flex flex-col gap-3 border-t border-rule pt-6 dark:border-rule-dark">
			<h2 class="font-display text-xl leading-tight">Security</h2>

			<form
				class="flex flex-col gap-3"
				onsubmit={(e) => { e.preventDefault(); handleChangePassphrase(); }}
			>
				<p class="text-sm text-ink-soft">
					Update your passphrase. Your existing entries stay readable — only the key that unlocks them is rewrapped.
				</p>
				<label class="flex flex-col gap-1.5 text-sm">
					<span class="font-medium text-ink-2">Current passphrase</span>
					<input
						bind:value={current}
						type="password"
						autocomplete="current-password"
						class="rounded-xl border border-rule bg-paper-2 px-3.5 py-2.5 outline-none transition focus:border-thread dark:border-rule-dark dark:bg-[#1d1e1a] dark:focus:border-thread-soft"
					/>
				</label>
				<label class="flex flex-col gap-1.5 text-sm">
					<span class="font-medium text-ink-2">New passphrase</span>
					<input
						bind:value={next}
						type="password"
						autocomplete="new-password"
						class="rounded-xl border border-rule bg-paper-2 px-3.5 py-2.5 outline-none transition focus:border-thread dark:border-rule-dark dark:bg-[#1d1e1a] dark:focus:border-thread-soft"
					/>
				</label>
				<label class="flex flex-col gap-1.5 text-sm">
					<span class="font-medium text-ink-2">Confirm new passphrase</span>
					<input
						bind:value={confirm}
						type="password"
						autocomplete="new-password"
						class="rounded-xl border border-rule bg-paper-2 px-3.5 py-2.5 outline-none transition focus:border-thread dark:border-rule-dark dark:bg-[#1d1e1a] dark:focus:border-thread-soft"
					/>
				</label>
				{#if error}
					<p class="text-sm text-[#a54a38]">{error}</p>
				{/if}
				{#if success}
					<p class="text-sm text-thread">Passphrase updated.</p>
				{/if}
				<button
					type="submit"
					disabled={!current || !next || next !== confirm || busy}
					class="btn-ink self-start"
				>
					{busy ? 'Updating...' : 'Update passphrase'}
				</button>
			</form>

			<div class="mt-4 flex flex-col gap-3 border-t border-rule pt-6 dark:border-rule-dark">
				<p class="text-sm text-ink-soft">
					Download a plaintext copy of every entry. This is the only way to recover your
					journal if you ever forget your passphrase.
				</p>
				{#if exportLocked}
					<p class="text-sm text-[#a54a38]">
						Your vault is locked. Unlock it on the Today page first, then return here to export.
					</p>
				{/if}
				{#if exportError}
					<p class="text-sm text-[#a54a38]">{exportError}</p>
				{/if}
				<button
					type="button"
					onclick={handleExport}
					disabled={exporting}
					class="btn-ghost self-start"
				>
					{exporting ? 'Exporting...' : 'Export plaintext'}
				</button>
			</div>

			<form method="POST" action="/auth/logout" onsubmit={() => clearVault()} class="mt-4 border-t border-rule pt-6 dark:border-rule-dark">
				<button type="submit" class="btn-danger">Sign out</button>
			</form>
		</section>
	</div>
</main>
