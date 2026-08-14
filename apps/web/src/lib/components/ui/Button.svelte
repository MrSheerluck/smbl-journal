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
		? 'bg-ink text-paper hover:bg-ink-2 dark:bg-[#f2f2f2] dark:text-[#141414] dark:hover:bg-paper-2'
		: 'border border-rule text-ink-2 hover:bg-paper-2 dark:border-[#2c2c2c] dark:text-[#cfcfcf] dark:hover:bg-[#232323]'} {className}"
>
	{@render children?.()}
</button>
