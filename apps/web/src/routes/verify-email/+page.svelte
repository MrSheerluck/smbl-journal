<script lang="ts">
	import AuthShell from '$lib/components/ui/AuthShell.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormError from '$lib/components/ui/FormError.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';

	let { form, data } = $props();
</script>

{#if data.status === 'code'}
	<AuthShell
		eyebrow="verify your email"
		title="enter the code"
		subtitle="We sent a code to your email. Enter it below to finish creating your account."
	>
		<form method="POST" class="flex flex-col gap-4">
			<input type="hidden" name="email" value={data.email} />
			<TextField
				label="Verification code"
				name="code"
				type="text"
				inputmode="numeric"
				autocomplete="one-time-code"
				center
				large
				required
			/>

			<FormError message={form?.error} />

			<Button class="mt-2">Verify</Button>
		</form>

		<p class="text-center text-sm text-neutral-500">
			No email? Check your spam folder, or
			<a
				href="/signup"
				class="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
			>
				sign up again
			</a>
			.
		</p>
	</AuthShell>
{:else if data.status === 'check-email'}
	<AuthShell eyebrow="verify your email" title="check your inbox">
		<div class="text-center">
			<p class="text-sm text-neutral-500">
				{#if data.email}
					We sent a verification code to
					<span class="font-medium text-neutral-900 dark:text-neutral-100">{data.email}</span>.
				{:else}
					We sent a verification code to your email.
				{/if}
			</p>
			<p class="mt-4 text-sm">
				<a
					href="/signup"
					class="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
				>
					Sign up again
				</a>
			</p>
		</div>
	</AuthShell>
{:else if data.status === 'error'}
	<AuthShell eyebrow="verify your email" title="that didn't work">
		<div class="text-center">
			<FormError message={data.error} />
			<p class="mt-4 text-sm">
				<a
					href="/signup"
					class="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100"
				>
					Try signing up again
				</a>
			</p>
		</div>
	</AuthShell>
{/if}
