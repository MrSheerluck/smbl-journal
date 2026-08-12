<script lang="ts">
	interface Props {
		label: string;
		name: string;
		type?: string;
		value?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		inputmode?: 'none' | 'text' | 'email' | 'search' | 'url' | 'tel' | 'numeric' | 'decimal';
		minlength?: number;
		required?: boolean;
		center?: boolean;
		large?: boolean;
	}
	let {
		label,
		name,
		type = 'text',
		value,
		autocomplete,
		inputmode,
		minlength,
		required,
		center = false,
		large = false
	}: Props = $props();
</script>

<label class="flex flex-col gap-1.5 text-sm">
	<span class="font-medium text-neutral-500">{label}</span>
	<input
		{name}
		{type}
		{value}
		{autocomplete}
		{inputmode}
		{minlength}
		{required}
		class="rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 outline-none transition focus:border-neutral-500 dark:border-neutral-700 dark:focus:border-neutral-400 {large ? 'text-lg' : ''} {center ? 'text-center tracking-[0.3em]' : ''}"
	/>
</label>
