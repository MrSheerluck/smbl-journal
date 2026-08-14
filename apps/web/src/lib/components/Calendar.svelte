<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { todayLocal } from '$lib/entries';

	const MONTHS = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
	];
	const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	function todayStr(): string {
		return todayLocal();
	}

	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}

	function toStr(y: number, m: number, d: number): string {
		return `${y}-${pad(m + 1)}-${pad(d)}`;
	}

	let entryDates = $state<Set<string>>(new Set());

	const today = todayStr();
	let selected = $state(today);

	let viewYear = $state(Number(today.slice(0, 4)));
	let viewMonth = $state(Number(today.slice(5, 7)) - 1);

	$effect(() => {
		const fromUrl = page.url.searchParams.get('date');
		const s = fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl) ? fromUrl : today;
		if (s !== selected) {
			selected = s;
			viewYear = Number(s.slice(0, 4));
			viewMonth = Number(s.slice(5, 7)) - 1;
		}
	});

	onMount(() => {
		fetch('/api/entries')
			.then((r) => (r.ok ? r.json() : []))
			.then((list: { entry_date: string }[]) => {
				entryDates = new Set(list.map((e) => e.entry_date));
			})
			.catch(() => {});
	});

	function daysInMonth(y: number, m: number): number {
		return new Date(y, m + 1, 0).getDate();
	}

	function cells(): (string | null)[] {
		const first = new Date(viewYear, viewMonth, 1).getDay();
		const total = daysInMonth(viewYear, viewMonth);
		const out: (string | null)[] = [];
		for (let i = 0; i < first; i++) out.push(null);
		for (let d = 1; d <= total; d++) out.push(toStr(viewYear, viewMonth, d));
		return out;
	}

	function isToday(d: string): boolean {
		return d === today;
	}

	function hasEntry(d: string): boolean {
		return entryDates.has(d);
	}

	function isFuture(d: string): boolean {
		return d > today;
	}

	function navigate(d: string) {
		goto(`/home?date=${d}`);
	}

	function shift(offset: number) {
		const d = new Date(viewYear, viewMonth + offset, 1);
		viewYear = d.getFullYear();
		viewMonth = d.getMonth();
	}
</script>

<div class="flex flex-col gap-2 px-3 py-4">
	<div class="flex items-center justify-between px-1">
		<span class="font-display text-sm font-semibold">
			{MONTHS[viewMonth]} {viewYear}
		</span>
		<div class="flex items-center gap-0.5">
			<button
				type="button"
				onclick={() => shift(-1)}
				class="flex h-6 w-6 items-center justify-center rounded-md text-ink-soft transition hover:bg-paper hover:text-ink dark:hover:bg-[#2a2b27] dark:hover:text-[#e8e4da]"
				aria-label="Previous month"
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M15 6l-6 6 6 6" />
				</svg>
			</button>
			<button
				type="button"
				onclick={() => shift(1)}
				class="flex h-6 w-6 items-center justify-center rounded-md text-ink-soft transition hover:bg-paper hover:text-ink dark:hover:bg-[#2a2b27] dark:hover:text-[#e8e4da]"
				aria-label="Next month"
			>
				<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 6l6 6-6 6" />
				</svg>
			</button>
		</div>
	</div>

	<div class="grid grid-cols-7 gap-y-0.5">
		{#each WEEKDAYS as wd}
			<span class="py-0.5 text-center font-mono text-[0.55rem] uppercase tracking-wide text-ink-soft">{wd}</span>
		{/each}
	</div>

	<div class="grid grid-cols-7 gap-y-0.5">
		{#each cells() as d, i}
			{#if d === null}
				<span class="aspect-square"></span>
			{:else}
				{@const entry = hasEntry(d)}
				{@const sel = d === selected}
				{@const future = isFuture(d)}
				{@const todayCell = isToday(d)}
				<button
					type="button"
					disabled={future}
					onclick={() => navigate(d)}
					title={d}
					class="relative flex aspect-square items-center justify-center rounded-full text-[0.8rem] transition disabled:cursor-not-allowed disabled:opacity-25"
					class:bg-thread={sel}
					class:text-paper={sel}
					class:text-ink-2={!sel}
					class:font-semibold={todayCell || sel}
					class:hover:bg-paper-2={!sel}
					class:dark:hover:bg-[#2a2b27]={!sel}
				>
					{Number(d.slice(8, 10))}
					{#if entry}
						<span
							class="absolute bottom-0.5 h-1 w-1 rounded-full"
							class:bg-paper={sel}
							class:bg-thread={!sel}
						></span>
					{/if}
				</button>
			{/if}
		{/each}
	</div>

	<p class="mt-1 px-1 font-mono text-[0.55rem] uppercase tracking-wide text-ink-soft">
		Filled dots mark days you wrote
	</p>
</div>
