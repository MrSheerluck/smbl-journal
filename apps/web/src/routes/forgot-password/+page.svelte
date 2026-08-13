<script lang="ts">
	import AuthShell from '$lib/components/ui/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormError from '$lib/components/ui/FormError.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';

	let { form } = $props();
</script>

{#if form?.sent}
	<AuthShell eyebrow="reset password" title="check your inbox">
		<div class="text-center">
			<p class="text-sm text-neutral-500">
				If an account exists for
				<span class="font-medium text-neutral-900 dark:text-neutral-100">{form.email}</span>,
				we sent a link to reset your password.
			</p>
			<p class="mt-4 text-sm">
				<a
					href="/login"
					class="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
				>
					Back to sign in
				</a>
			</p>
		</div>
	</AuthShell>
{:else}
	<AuthShell
		eyebrow="reset password"
		title="forgot your password?"
		subtitle="Enter your email and we'll send a link to reset it."
	>
		<form method="POST" class="flex flex-col gap-4">
			<TextField label="Email" name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />

			<FormError message={form?.error} />

			<Button class="mt-2">Send reset link</Button>
		</form>

		<p class="text-center text-sm text-neutral-500">
			<a
				href="/login"
				class="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
			>
				Back to sign in
			</a>
		</p>
	</AuthShell>
{/if}
