<script lang="ts">
	import { page } from '$app/state';
	import AuthShell from '$lib/components/ui/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormError from '$lib/components/ui/FormError.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';

	let { form } = $props();
</script>

<AuthShell title="welcome back" subtitle="Sign in to open your private journal.">
	<form method="POST" class="flex flex-col gap-4">
		<TextField label="Email" name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />
		<TextField label="Password" name="password" type="password" autocomplete="current-password" required />

		{#if page.url.searchParams.get('reset') === '1'}
			<p class="text-xs text-emerald-600 dark:text-emerald-400">
				Your password was reset. Sign in with your new password.
			</p>
		{/if}
		<FormError message={form?.error} />

		<Button class="mt-2">Sign in</Button>
	</form>

	<div class="flex items-center justify-between text-sm text-neutral-500">
		<a
			href="/forgot-password"
			class="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
		>
			Forgot password?
		</a>
		<a
			href="/signup"
			class="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
		>
			Create an account
		</a>
	</div>
</AuthShell>
