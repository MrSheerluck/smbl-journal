<script lang="ts">
	import { icons, type IconName } from './icons';

	interface Props {
		icon: IconName;
		label: string;
		active?: boolean;
		disabled?: boolean;
		onclick?: () => void;
		size?: 'md' | 'sm';
	}

	let { icon, label, active = false, disabled = false, onclick, size = 'md' }: Props = $props();

	const sizeClass = $derived(size === 'md' ? 'h-7.5 w-7.5' : 'h-7 w-7');
</script>

<button
	type="button"
	aria-label={label}
	title={label}
	{onclick}
	{disabled}
	class={`flex items-center justify-center rounded-md text-ink-soft transition hover:bg-paper-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-[#2c2c2c] dark:hover:text-[#f2f2f2] ${sizeClass} ${
		active ? 'bg-paper-2 text-ink dark:bg-[#2c2c2c] dark:text-[#f2f2f2]' : ''
	}`}
>
	<svg
		class="h-4 w-4"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		{@html icons[icon]}
	</svg>
</button>
