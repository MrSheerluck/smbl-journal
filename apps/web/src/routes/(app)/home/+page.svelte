<script lang="ts">
	import { vaultStatus, unlockVault, clearVault } from '$lib/vault';
	import { todayLocal, loadEntry, saveTodayEntry } from '$lib/entries';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';

	let passphrase = $state('');
	let error = $state('');
	let busy = $state(false);

	let body = $state('');
	let saving = $state(false);
	let saved = $state(false);
	let loadFailed = $state(false);
	let loadedDate = $state('');

	$effect(() => {
		if ($vaultStatus === 'unlocked') {
			loadEntry(todayLocal())
				.then((existing) => {
					body = existing ?? '';
					loadedDate = todayLocal();
				})
				.catch(() => (loadFailed = true));
		}
	});

	async function unlock() {
		if (!passphrase || busy) return;
		busy = true;
		error = '';
		try {
			const ok = await unlockVault(passphrase);
			if (!ok) {
				error = 'Incorrect passphrase. Try again.';
				passphrase = '';
			}
		} catch {
			error = 'Could not unlock your vault. Try again.';
		} finally {
			busy = false;
		}
	}

	async function save() {
		if (saving) return;
		saving = true;
		saved = false;
		try {
			await saveTodayEntry(body);
			saved = true;
		} catch {
			error = 'Failed to save your entry.';
		} finally {
			saving = false;
		}
	}
</script>

<main class="flex min-h-screen flex-col">
	<div class="flex justify-end p-4">
		<form method="POST" action="/auth/logout" onsubmit={() => clearVault()}>
			<button
				type="submit"
				class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
			>
				Sign out
			</button>
		</form>
	</div>

	{#if $vaultStatus === 'locked'}
		<form
			class="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-16"
			onsubmit={(e) => { e.preventDefault(); unlock(); }}
		>
			<p class="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">unlock your vault</p>
			<label class="flex flex-col gap-1.5 text-sm">
				<span class="font-medium text-neutral-500">Passphrase</span>
				<input
					bind:value={passphrase}
					type="password"
					autocomplete="current-password"
					class="rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 outline-none transition focus:border-neutral-500 dark:border-neutral-700 dark:focus:border-neutral-400"
				/>
			</label>
			{#if error}
				<p class="text-xs text-red-500">{error}</p>
			{/if}
			<button
				type="submit"
				disabled={!passphrase || busy}
				class="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
			>
				{busy ? 'Unlocking...' : 'Unlock'}
			</button>
		</form>
	{:else}
		<div class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8">
			<div class="flex items-center justify-between">
				<p class="text-sm text-neutral-500">Today {todayLocal()}</p>
				<button
					onclick={save}
					disabled={saving}
					class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
				>
					{saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
				</button>
			</div>
			<div class="overflow-hidden rounded-xl border border-neutral-300 dark:border-neutral-700">
				<RichTextEditor
					content={body}
					reloadKey={loadedDate}
					placeholder="Write what's on your mind..."
					onChange={(md) => (body = md)}
				/>
			</div>
			{#if loadFailed}
				<p class="text-xs text-red-500">Couldn't load today's entry.</p>
			{/if}
		</div>
	{/if}
</main>
