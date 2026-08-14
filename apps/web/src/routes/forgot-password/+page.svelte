<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/ui/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormError from '$lib/components/ui/FormError.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';

	let { form } = $props();

	let submitting = $state(false);
</script>

{#if form?.sent}
	<AuthShell eyebrow="reset password" title="check your inbox">
		<div class="text-center">
			<p class="text-sm text-ink-soft">
				If an account exists for
				<span class="font-medium text-ink dark:text-[#f2f2f2]">{form.email}</span>,
				we sent a link to reset your password.
			</p>
			<p class="mt-4 text-sm">
				<a
					href="/login"
					class="font-medium text-ink underline underline-offset-2 dark:text-[#f2f2f2]"
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
		<form
			method="POST"
			class="flex flex-col gap-4"
			use:enhance={({}) => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<TextField label="Email" name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />

			<FormError message={form?.error} />

			<Button disabled={submitting} class="mt-2">{submitting ? 'Sending\u2026' : 'Send reset link'}</Button>
		</form>

		<p class="text-center text-sm text-ink-soft">
			<a
				href="/login"
				class="font-medium text-ink underline underline-offset-2 dark:text-[#f2f2f2]"
			>
				Back to sign in
			</a>
		</p>
	</AuthShell>
{/if}
