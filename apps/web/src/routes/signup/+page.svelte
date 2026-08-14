<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/ui/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormError from '$lib/components/ui/FormError.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';

	let { form } = $props();

	let submitting = $state(false);
</script>

<AuthShell
	title="create your account"
	subtitle="Your journal is encrypted end to end. We'll send you a link to verify your email."
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
		<TextField label="Password" name="password" type="password" autocomplete="new-password" minlength={8} required />
		<TextField label="Confirm password" name="confirm" type="password" autocomplete="new-password" minlength={8} required />

		<FormError message={form?.error} />

		<Button disabled={submitting} class="mt-2">{submitting ? 'Creating account\u2026' : 'Create account'}</Button>
	</form>

	<p class="text-center text-sm text-ink-soft">
		Already have an account?
		<a
			href="/login"
			class="font-medium text-ink underline underline-offset-2 dark:text-[#f2f2f2]"
		>
			Sign in
		</a>
	</p>
</AuthShell>
