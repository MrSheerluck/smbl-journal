<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let { children } = $props();

	let settingsOpen = $state(false);
	let sidebarOpen = $state(false);
</script>

<div class="flex h-dvh overflow-hidden">
	<Sidebar
		open={sidebarOpen}
		onClose={() => (sidebarOpen = false)}
		onOpenSettings={() => {
			settingsOpen = true;
		}}
	/>

	<div class="relative flex min-w-0 flex-1 flex-col">
		<header class="flex shrink-0 items-center justify-between gap-3 border-b border-rule bg-paper/80 px-4 py-2.5 backdrop-blur lg:hidden dark:border-rule-dark dark:bg-[#141414]/80">
			<button
				type="button"
				onclick={() => (sidebarOpen = true)}
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-paper-2 hover:text-ink dark:hover:bg-[#232323] dark:hover:text-[#f2f2f2]"
				aria-label="Open menu"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			</button>
			<span class="font-display text-base font-semibold tracking-tight text-ink dark:text-[#f2f2f2]">
				smbl journal
			</span>
			<span class="w-9 shrink-0"></span>
		</header>

		<div class="min-w-0 flex-1 overflow-y-auto">{@render children()}</div>
	</div>
</div>

{#if settingsOpen}
	<SettingsModal onClose={() => (settingsOpen = false)} />
{/if}
