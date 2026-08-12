<script lang="ts">
	import AuthShell from '$lib/components/ui/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormError from '$lib/components/ui/FormError.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';

	let { form } = $props();
</script>

<AuthShell
	title="create your account"
	subtitle="Your journal is encrypted end to end. We'll send you a link to verify your email."
>
	<form method="POST" class="flex flex-col gap-4">
		<TextField label="Email" name="email" type="email" autocomplete="email" value={form?.email ?? ''} required />
		<TextField label="Password" name="password" type="password" autocomplete="new-password" minlength={8} required />
		<TextField label="Confirm password" name="confirm" type="password" autocomplete="new-password" minlength={8} required />

		<FormError message={form?.error} />

		<Button class="mt-2">Create account</Button>
	</form>

	<p class="text-center text-sm text-neutral-500">
		Already have an account?
		<a
			href="/login"
			class="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
		>
			Sign in
		</a>
	</p>
</AuthShell>
