<script lang="ts">
	import type { SlashItem } from './slash-command';

	interface Props {
		items: SlashItem[];
		onSelect: (item: SlashItem) => void;
	}

	let { items, onSelect }: Props = $props();

	let selected = $state(0);
	let listEl = $state<HTMLDivElement>();

	$effect(() => {
		selected = 0;
	});

	function select(item: SlashItem) {
		onSelect(item);
	}

	function scrollIntoView() {
		listEl?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' });
	}

	export function handleKeyDown(event: KeyboardEvent): boolean {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selected = Math.min(selected + 1, items.length - 1);
			scrollIntoView();
			return true;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			selected = Math.max(selected - 1, 0);
			scrollIntoView();
			return true;
		}
		if (event.key === 'Enter' || event.key === 'Tab') {
			if (items.length === 0) return false;
			event.preventDefault();
			select(items[selected]);
			return true;
		}
		return false;
	}

	export function update(props: { items: SlashItem[]; onSelect: (item: SlashItem) => void }) {
		items = props.items;
		onSelect = props.onSelect;
		selected = 0;
	}

	export function destroy() {}
</script>

<div
	bind:this={listEl}
	class="max-h-72 w-64 overflow-y-auto rounded-xl border border-rule bg-paper-2 p-1.5 shadow-xl dark:border-[#2c2c2c] dark:bg-[#1b1b1b]"
	role="listbox"
	aria-label="Insert menu"
>
	{#if items.length === 0}
		<div class="px-3 py-4 text-center text-xs text-ink-soft">No results</div>
	{:else}
		{#each items as item, i (item.title)}
			<button
				type="button"
				role="option"
				aria-selected={i === selected}
				data-selected={i === selected ? 'true' : undefined}
				class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition"
				class:bg-paper-2={i === selected}
				class:dark:bg-[#232323]={i === selected}
				onmouseenter={() => (selected = i)}
				onmousedown={(e) => {
					e.preventDefault();
					select(item);
				}}
			>
				<span
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-rule bg-paper-2 text-xs font-semibold text-ink-soft dark:border-[#2c2c2c] dark:bg-[#232323] dark:text-ink-2"
				>
					{item.icon}
				</span>
				<span class="flex min-w-0 flex-col">
					<span class="truncate text-sm font-medium text-ink dark:text-[#f2f2f2]">{item.title}</span>
					<span class="truncate text-xs text-ink-soft dark:text-ink-soft">{item.description}</span>
				</span>
			</button>
		{/each}
	{/if}
</div>
