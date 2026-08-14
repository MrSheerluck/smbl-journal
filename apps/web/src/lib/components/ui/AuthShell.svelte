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
	class="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16 text-ink dark:text-[#f2f2f2]"
>
	<header class="flex flex-col gap-1">
		<p class="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">{eyebrow}</p>
		<h1 class="font-display text-4xl font-medium leading-tight">{title}</h1>
		{#if subtitle}
			<p class="text-sm text-ink-soft">{subtitle}</p>
		{/if}
	</header>

	{@render children?.()}
</main>
