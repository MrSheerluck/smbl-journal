<script lang="ts">
	import { theme } from '$lib/theme.svelte';
	import type { Theme } from '$lib/theme.svelte';

	const options: { value: Theme; label: string }[] = [
		{ value: 'system', label: 'System' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];
</script>

<main class="min-h-screen flex flex-col items-center justify-center gap-6 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
	<h1 class="text-3xl font-semibold tracking-tight">smbl journal</h1>
	<p class="text-sm text-neutral-500 dark:text-neutral-400">a private place to write.</p>

	<div class="flex gap-1 rounded-full border border-neutral-200 p-1 dark:border-neutral-800">
		{#each options as { value, label }}
			<button
				type="button"
				onclick={() => (theme.value = value)}
				class="rounded-full px-3 py-1 text-xs
					{theme.value === value
						? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
						: 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'}"
			>
				{label}
			</button>
		{/each}
	</div>
</main>
