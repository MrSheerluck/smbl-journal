<script lang="ts">
	import { onMount } from 'svelte';
	import { vaultStatus } from '$lib/vault';
	import { listEntryDates, loadEntry } from '$lib/entries';
	import ReadOnlyView from '$lib/components/editor/ReadOnlyView.svelte';

	const MONTHS = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	function monthKey(date: string): string {
		const [y, m] = date.split('-');
		return `${y}-${m}`;
	}

	function monthLabel(key: string): string {
		const [y, m] = key.split('-');
		return `${MONTHS[Number(m) - 1]} ${y}`;
	}

	function prettyDate(date: string): string {
		const [, m, d] = date.split('-');
		return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${date.slice(0, 4)}`;
	}

	let dates = $state<string[]>([]);
	let grouped = $state<{ key: string; label: string; dates: string[] }[]>([]);
	let loading = $state(true);
	let error = $state('');

	let openDate = $state<string | null>(null);
	let body = $state('');
	let reading = $state(false);

	onMount(() => {
		if ($vaultStatus !== 'unlocked') return;
		void refresh();
	});

	async function refresh() {
		loading = true;
		error = '';
		try {
			const all = await listEntryDates();
			dates = all;
			const byMonth = new Map<string, string[]>();
			for (const d of all) {
				const k = monthKey(d);
				if (!byMonth.has(k)) byMonth.set(k, []);
				byMonth.get(k)!.push(d);
			}
			grouped = [...byMonth.entries()].map(([key, ds]) => ({
				key,
				label: monthLabel(key),
				dates: ds
			}));
		} catch {
			error = "Couldn't load your archive.";
		} finally {
			loading = false;
		}
	}

	async function open(date: string) {
		openDate = date;
		body = '';
		reading = true;
		try {
			body = (await loadEntry(date)) ?? '';
		} catch {
			body = '';
		} finally {
			reading = false;
		}
	}

	function close() {
		openDate = null;
		body = '';
	}
</script>

<main class="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-8">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a
				href="/home"
				class="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
			>&larr; Today</a>
			<p class="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">archive</p>
		</div>
		<span class="text-sm text-neutral-500">{dates.length} {dates.length === 1 ? 'entry' : 'entries'}</span>
	</div>

	{#if $vaultStatus === 'locked'}
		<p class="text-sm text-neutral-500">
			Your vault is locked. <a href="/home" class="underline">Unlock it</a> to read your archive.
		</p>
	{:else if openDate}
		<section class="flex flex-col gap-3">
			<div class="flex items-center justify-between">
				<h1 class="text-lg font-semibold">{prettyDate(openDate)}</h1>
				<button
					onclick={close}
					class="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
				>Back</button>
			</div>
			<div class="min-h-24 rounded-xl border border-neutral-300 p-5 dark:border-neutral-700">
				{#if reading}
					<p class="text-sm text-neutral-400">Reading...</p>
				{:else if body}
					<ReadOnlyView content={body} />
				{:else}
					<p class="text-sm text-neutral-400">This entry is empty.</p>
				{/if}
			</div>
		</section>
	{:else if loading}
		<p class="text-sm text-neutral-400">Loading archive...</p>
	{:else if error}
		<p class="text-sm text-red-500">{error}</p>
	{:else if dates.length === 0}
		<div class="flex flex-col items-center gap-2 py-16 text-center">
			<p class="text-sm text-neutral-500">No entries yet.</p>
			<p class="text-xs text-neutral-400">
				<a href="/home" class="underline">Write your first entry</a> — it'll show up here.
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-8">
			{#each grouped as month (month.key)}
				<section class="flex flex-col gap-1">
					<h2 class="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
						{month.label}
					</h2>
					{#each month.dates as date (date)}
						<button
							onclick={() => open(date)}
							class="group flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-neutral-100 dark:hover:bg-neutral-900"
						>
							<span class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
								{prettyDate(date)}
							</span>
							<span class="text-neutral-400 transition group-hover:text-neutral-600 dark:group-hover:text-neutral-300">&rarr;</span>
						</button>
					{/each}
				</section>
			{/each}
		</div>
	{/if}
</main>
