<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'submit' | 'button';
		disabled?: boolean;
		variant?: 'primary' | 'secondary';
		class?: string;
		children?: Snippet;
	}
	let {
		type = 'submit',
		disabled = false,
		variant = 'primary',
		class: className = '',
		children
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	class="rounded-lg px-4 py-2.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 {variant === 'primary'
		? 'bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300'
		: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900'} {className}"
>
	{@render children?.()}
</button>
