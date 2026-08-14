<script lang="ts">
	import { clearVault } from '$lib/vault';
	import { theme, type Theme } from '$lib/theme.svelte';

	const options: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];
</script>

<main class="relative flex min-h-screen w-full flex-col px-6 py-6 sm:px-10">
	<header class="flex items-center justify-between border-b border-rule pb-4 dark:border-rule-dark">
		<p class="eyebrow text-thread">settings</p>
	</header>

	<div class="flex max-w-xl flex-col gap-8 py-8">
		<section class="flex flex-col gap-3">
			<h2 class="font-display text-xl leading-tight">Appearance</h2>
			<div class="flex flex-col gap-2">
				{#each options as option}
					<button
						type="button"
						onclick={() => (theme.value = option.value)}
						class="flex items-center justify-between rounded-xl border border-rule px-4 py-3 text-sm transition hover:border-ink-soft dark:border-rule-dark dark:hover:border-[#4a4b44]"
						class:border-thread={theme.value === option.value}
						class:dark:border-thread-soft={theme.value === option.value}
					>
						<span>{option.label}</span>
						{#if theme.value === option.value}
							<span class="text-thread">&check;</span>
						{/if}
					</button>
				{/each}
			</div>
		</section>

		<section class="flex flex-col gap-3 border-t border-rule pt-6 dark:border-rule-dark">
			<h2 class="font-display text-xl leading-tight">Security</h2>
			<form method="POST" action="/auth/logout" onsubmit={() => clearVault()}>
				<button type="submit" class="btn-danger">Sign out</button>
			</form>
		</section>
	</div>
</main>
