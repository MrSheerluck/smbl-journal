<script lang="ts">
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<div class="flex h-dvh">
	<Sidebar />
	<div class="relative min-w-0 flex-1 overflow-y-auto">{@render children()}</div>
</div>
