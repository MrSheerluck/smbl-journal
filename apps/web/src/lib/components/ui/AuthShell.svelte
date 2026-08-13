<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		eyebrow?: string;
		subtitle?: string;
		children?: Snippet;
	}
	let { title, eyebrow = 'smbl journal', subtitle = '', children }: Props = $props();
</script>

<main
	class="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16 text-neutral-900 dark:text-neutral-100"
>
	<header class="flex flex-col gap-1">
		<p class="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">{eyebrow}</p>
		<h1 class="text-3xl font-semibold tracking-tight">{title}</h1>
		{#if subtitle}
			<p class="text-sm text-neutral-500">{subtitle}</p>
		{/if}
	</header>

	{@render children?.()}
</main>
