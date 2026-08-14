<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let { children } = $props();

	let settingsOpen = $state(false);
</script>

<div class="flex h-dvh">
	<Sidebar onOpenSettings={() => (settingsOpen = true)} />
	<div class="relative min-w-0 flex-1 overflow-y-auto">{@render children()}</div>
</div>

{#if settingsOpen}
	<SettingsModal onClose={() => (settingsOpen = false)} />
{/if}
