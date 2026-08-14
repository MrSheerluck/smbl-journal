<script lang="ts">
	import { clearVault, changePassphrase, getVaultKey } from '$lib/vault';
	import { exportPlaintext } from '$lib/entries';
	import { theme, type Theme } from '$lib/theme.svelte';
	import { font, FONT_PRESETS, type FontKey } from '$lib/fonts.svelte';

	let { onClose }: { onClose: () => void } = $props();

	const fontKeys = Object.keys(FONT_PRESETS) as FontKey[];

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

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
	<button
		type="button"
		class="absolute inset-0 bg-black/50 backdrop-blur-sm"
		aria-label="Close settings"
		onclick={onClose}
	></button>

	<div
		class="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-rule bg-paper shadow-xl dark:border-rule-dark dark:bg-[#141414]"
	>
		<header class="flex items-center justify-between border-b border-rule px-6 py-4 dark:border-rule-dark">
			<p class="eyebrow text-thread">settings</p>
			<button
				type="button"
				onclick={onClose}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition hover:bg-paper-2 hover:text-ink dark:hover:bg-[#232323] dark:hover:text-[#f2f2f2]"
				aria-label="Close settings"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
			<div>
				<h2 class="font-display text-lg leading-tight">Appearance</h2>

				<div class="mt-3 flex items-center justify-between gap-4">
					<p class="text-sm text-ink-2">Theme</p>
					<div class="flex rounded-full border border-rule bg-paper-2 p-0.5 dark:border-rule-dark">
						{#each options as option}
							<button
								type="button"
								onclick={() => (theme.value = option.value)}
								class="rounded-full px-3.5 py-1.5 text-sm transition"
								class:bg-ink={theme.value === option.value}
								class:text-paper={theme.value === option.value}
								class:text-ink-soft={theme.value !== option.value}
								class:dark:bg-[#f2f2f2]={theme.value === option.value}
								class:dark:text-[#141414]={theme.value === option.value}
							>
								{option.label}
							</button>
						{/each}
					</div>
				</div>

				<div class="mt-4 flex flex-col gap-2">
					<p class="text-sm text-ink-2">Font</p>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
						{#each fontKeys as key}
							<button
								type="button"
								onclick={() => (font.value = key)}
								class="flex flex-col items-center gap-1 rounded-xl border border-rule px-3 py-2.5 text-sm transition hover:border-ink-soft dark:border-rule-dark dark:hover:border-[#383838]"
								class:border-thread={font.value === key}
								class:dark:border-thread-soft={font.value === key}
							>
								<span
									class="font-display text-base leading-none"
									style:font-family={FONT_PRESETS[key].display}
								>
									Aa
								</span>
								<span class="text-xs text-ink-soft">{FONT_PRESETS[key].label}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="my-5 h-px bg-rule dark:bg-rule-dark"></div>

			<div>
				<h2 class="font-display text-lg leading-tight">Passphrase</h2>
				<p class="mt-1 text-sm text-ink-soft">
					Update your passphrase. Your existing entries stay readable, and only the key that
					unlocks them is rewrapped.
				</p>

				<form
					class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
					onsubmit={(e) => { e.preventDefault(); handleChangePassphrase(); }}
				>
					<label class="col-span-1 flex flex-col gap-1.5 text-sm sm:col-span-2">
						<span class="font-medium text-ink-2">Current passphrase</span>
						<input
							bind:value={current}
							type="password"
							autocomplete="current-password"
							class="rounded-xl border border-rule bg-paper-2 px-3.5 py-2.5 outline-none transition focus:border-thread dark:border-rule-dark dark:bg-[#1b1b1b] dark:focus:border-thread-soft"
						/>
					</label>
					<label class="flex flex-col gap-1.5 text-sm">
						<span class="font-medium text-ink-2">New passphrase</span>
						<input
							bind:value={next}
							type="password"
							autocomplete="new-password"
							class="rounded-xl border border-rule bg-paper-2 px-3.5 py-2.5 outline-none transition focus:border-thread dark:border-rule-dark dark:bg-[#1b1b1b] dark:focus:border-thread-soft"
						/>
					</label>
					<label class="flex flex-col gap-1.5 text-sm">
						<span class="font-medium text-ink-2">Confirm new passphrase</span>
						<input
							bind:value={confirm}
							type="password"
							autocomplete="new-password"
							class="rounded-xl border border-rule bg-paper-2 px-3.5 py-2.5 outline-none transition focus:border-thread dark:border-rule-dark dark:bg-[#1b1b1b] dark:focus:border-thread-soft"
						/>
					</label>
					{#if error}
						<p class="text-sm text-[#a54a38] sm:col-span-2">{error}</p>
					{/if}
					{#if success}
						<p class="text-sm text-thread sm:col-span-2">Passphrase updated.</p>
					{/if}
					<button
						type="submit"
						disabled={!current || !next || next !== confirm || busy}
						class="btn-ink sm:col-span-2 sm:justify-self-end"
					>
						{busy ? 'Updating...' : 'Update passphrase'}
					</button>
				</form>
			</div>

			<div class="my-5 h-px bg-rule dark:bg-rule-dark"></div>

			<div>
				<h2 class="font-display text-lg leading-tight">Export</h2>
				<p class="mt-1 text-sm text-ink-soft">
					Download a markdown copy of every entry. This is the only way to recover your journal
					if you ever forget your passphrase.
				</p>
				<div class="mt-3 flex items-center gap-3">
					{#if exportLocked}
						<p class="text-sm text-[#a54a38]">
							Your vault is locked. Unlock it on the Today page first, then return here to export.
						</p>
					{:else if exportError}
						<p class="text-sm text-[#a54a38]">{exportError}</p>
					{:else}
						<button
							type="button"
							onclick={handleExport}
							disabled={exporting}
							class="btn-ghost"
						>
							{exporting ? 'Exporting...' : 'Export journal'}
						</button>
					{/if}
				</div>
			</div>

			<div class="mt-5 flex items-center justify-between border-t border-rule pt-5 dark:border-rule-dark">
				<div>
					<h2 class="font-display text-lg leading-tight">Sign out</h2>
					<p class="mt-1 text-sm text-ink-soft">This clears your vault key from this device.</p>
				</div>
				<form method="POST" action="/auth/logout" onsubmit={() => clearVault()}>
					<button type="submit" class="btn-danger">Sign out</button>
				</form>
			</div>
		</div>
	</div>
</div>
