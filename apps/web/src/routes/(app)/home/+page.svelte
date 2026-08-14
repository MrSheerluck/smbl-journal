<script lang="ts">
	import { page } from '$app/state';
	import { vaultStatus, unlockVault, clearVault, resetVault } from '$lib/vault';
	import { todayLocal, loadEntry, saveEntry, prefetchSurroundingMonths } from '$lib/entries';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import ReadOnlyView from '$lib/components/editor/ReadOnlyView.svelte';

	const MONTHS = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	function prettyDate(date: string): string {
		const [y, m, d] = date.split('-');
		return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
	}

	let passphrase = $state('');
	let error = $state('');
	let busy = $state(false);

	let showReset = $state(false);
	let resetConfirm = $state('');
	let resetting = $state(false);
	let resetError = $state('');

	let body = $state('');
	let loadFailed = $state(false);
	let loadedDate = $state('');
	let reloadVersion = $state(0);

	type SaveStatus = 'idle' | 'saving' | 'saved';
	let saveStatus = $state<SaveStatus>('idle');
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let saveDirty = false;

	const today = todayLocal();

	function selectedDate(): string {
		const fromUrl = page.url.searchParams.get('date');
		return fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl) ? fromUrl : today;
	}

	const date = $derived(selectedDate());
	const isFuture = $derived(date > today);

	$effect(() => {
		if ($vaultStatus !== 'unlocked') return;
		void prefetchSurroundingMonths();
		const d = selectedDate();
		loadEntry(d)
			.then((existing) => {
				body = existing ?? '';
				loadedDate = d;
			})
			.catch(() => (loadFailed = true));
	});

	async function unlock() {
		if (!passphrase || busy) return;
		busy = true;
		error = '';
		try {
			const ok = await unlockVault(passphrase);
			if (!ok) {
				error = 'That passphrase is not right. Try again.';
				passphrase = '';
			}
		} catch {
			error = 'Could not unlock your vault. Try again.';
		} finally {
			busy = false;
		}
	}

	async function handleReset() {
		if (resetting) return;
		resetting = true;
		resetError = '';
		try {
			await resetVault();
			window.location.href = '/setup';
		} catch {
			resetError = 'Could not reset your vault. Try again.';
			resetting = false;
		}
	}

	function onEdit(md: string) {
		body = md;
		saveDirty = true;
		saveStatus = 'idle';
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => void autosave(), 800);
	}

	async function autosave() {
		if (!saveDirty || saveStatus === 'saving') return;
		saveDirty = false;
		saveStatus = 'saving';
		try {
			await saveEntry(date, body);
			saveStatus = 'saved';
		} catch {
			saveDirty = true;
			saveStatus = 'idle';
			error = 'Autosave failed. Your words are safe here — keep typing.';
		}
		setTimeout(() => {
			if (saveStatus === 'saved') saveStatus = 'idle';
		}, 1800);
	}

	function statusLabel(s: SaveStatus): string {
		if (s === 'saving') return 'Saving\u2026';
		if (s === 'saved') return 'Saved';
		return '';
	}
</script>

<main class="flex h-full w-full flex-col px-6 py-6 sm:px-10">
	<header class="flex items-center justify-between border-b border-rule pb-4 dark:border-rule-dark">
		<p class="eyebrow text-thread">{isFuture ? 'entry for' : 'today'}</p>
		<span class="eyebrow text-ink-soft transition-opacity" class:opacity-0={isFuture || saveStatus === 'idle'}>
			{statusLabel(saveStatus)}
		</span>
	</header>

	{#if $vaultStatus === 'locked'}
		<div class="flex flex-1 items-center justify-center">
			<form
				class="flex w-full max-w-sm flex-col gap-5 py-16"
				onsubmit={(e) => { e.preventDefault(); unlock(); }}
			>
				<div class="flex flex-col gap-1.5">
					<p class="eyebrow text-thread">unlock your vault</p>
					<h1 class="font-display text-3xl leading-tight">Open your journal.</h1>
					<p class="text-sm text-ink-soft">
						Enter your passphrase to read and write. It never leaves this device.
					</p>
				</div>
				<label class="flex flex-col gap-1.5 text-sm">
					<span class="font-medium text-ink-2">Passphrase</span>
					<input
						bind:value={passphrase}
						type="password"
						autocomplete="current-password"
						class="rounded-xl border border-rule bg-paper-2 px-3.5 py-2.5 outline-none transition focus:border-thread dark:border-rule-dark dark:bg-[#1b1b1b] dark:focus:border-thread-soft"
					/>
				</label>
				{#if error}
					<p class="text-sm text-[#a54a38]">{error}</p>
				{/if}
				<button type="submit" disabled={!passphrase || busy} class="btn-ink">
					{busy ? 'Opening...' : 'Unlock'}
				</button>

				<div class="flex flex-col gap-2 border-t border-rule pt-4 dark:border-rule-dark">
					{#if !showReset}
						<button
							type="button"
							onclick={() => (showReset = true)}
							class="text-sm text-ink-soft underline decoration-dotted underline-offset-2 transition hover:text-ink dark:hover:text-[#f2f2f2]"
						>
							Forgot your passphrase?
						</button>
					{:else}
						<div class="flex flex-col gap-2.5 rounded-xl border border-[#e0c4bc] bg-[#fbf3f0] p-3.5 dark:border-[#5a3c33] dark:bg-[#241b17]">
							<p class="text-sm leading-relaxed text-[#7a3b2c] dark:text-[#e0a794]">
								Starting a new vault is irreversible. Your current passphrase is the only key to your
								existing entries — without it, they cannot be recovered. Resetting will
								<strong>permanently delete</strong> every entry and begin a fresh journal.
							</p>
							<label class="flex flex-col gap-1.5 text-sm">
								<span class="font-medium text-[#7a3b2c] dark:text-[#e0a794]">Type DELETE to confirm</span>
								<input
									bind:value={resetConfirm}
									type="text"
									autocomplete="off"
									class="rounded-xl border border-[#e0c4bc] bg-transparent px-3.5 py-2.5 text-sm outline-none transition focus:border-[#a54a38] dark:border-[#5a3c33] dark:focus:border-[#e0a794]"
								/>
							</label>
							{#if resetError}
								<p class="text-xs text-[#a54a38]">{resetError}</p>
							{/if}
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={() => { showReset = false; resetConfirm = ''; resetError = ''; }}
									class="btn-ghost flex-1"
								>
									Cancel
								</button>
								<button
									type="button"
									onclick={handleReset}
									disabled={resetConfirm !== 'DELETE' || resetting}
									class="btn-danger flex-1"
								>
									{resetting ? 'Resetting...' : 'Delete & start new'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			</form>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col py-6">
			<div class="flex shrink-0 flex-col">
				<p class="eyebrow text-thread">{isFuture ? 'reading' : 'entry for'}</p>
				<h1 class="font-display text-3xl leading-tight sm:text-4xl">{prettyDate(date)}</h1>
			</div>

			<div class="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-rule bg-paper-2/60 shadow-[0_1px_0_rgba(32,33,30,0.04)] dark:border-rule-dark dark:bg-[#1b1b1b]/60">
				{#if isFuture}
					<div class="min-h-0 flex-1 overflow-y-auto px-7 py-6">
						{#if body}
							<ReadOnlyView content={body} />
						{:else}
							<p class="text-ink-soft">Nothing written on this day.</p>
						{/if}
					</div>
				{:else}
					<RichTextEditor
						content={body}
						reloadKey={`${loadedDate}#${reloadVersion}`}
						placeholder="Write what's on your mind..."
						onChange={onEdit}
					/>
				{/if}
			</div>

			{#if error}
				<p class="mt-3 text-sm text-[#a54a38]">{error}</p>
			{/if}
			{#if loadFailed}
				<p class="mt-3 text-sm text-[#a54a38]">Couldn't load this entry.</p>
			{/if}
		</div>
	{/if}
</main>
