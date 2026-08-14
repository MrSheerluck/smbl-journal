<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/ui/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormError from '$lib/components/ui/FormError.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';

	let { form, data } = $props();

	let submitting = $state(false);
</script>

{#if !data.token}
	<AuthShell eyebrow="reset password" title="link didn't work">
		<div class="text-center">
			<FormError message={data.error} />
			<p class="mt-4 text-sm">
				<a
					href="/forgot-password"
					class="font-medium text-ink underline underline-offset-2 dark:text-[#f2f2f2]"
				>
					Request a new link
				</a>
			</p>
		</div>
	</AuthShell>
{:else}
	<AuthShell
		eyebrow="reset password"
		title="choose a new password"
		subtitle="It must be at least 8 characters."
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
			<input type="hidden" name="token" value={data.token} />

			<TextField label="New password" name="password" type="password" autocomplete="new-password" minlength={8} required />
			<TextField label="Confirm new password" name="confirm" type="password" autocomplete="new-password" minlength={8} required />

			<FormError message={form?.error} />

			<Button disabled={submitting} class="mt-2">{submitting ? 'Resetting\u2026' : 'Reset password'}</Button>
		</form>
	</AuthShell>
{/if}
