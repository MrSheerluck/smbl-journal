<script lang="ts">
	import { loginUrl } from '$lib/api';
</script>

<main
	class="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 text-center"
>
	<p class="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">smbl journal</p>
	<h1 class="max-w-md text-3xl font-semibold tracking-tight">a private place to write.</h1>
	<p class="max-w-sm text-sm text-neutral-500">
		Your journal is encrypted end to end.
	</p>

	<div class="flex w-full max-w-xs flex-col gap-2">
		<a
			href={loginUrl('sign-in')}
			class="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
		>
			Sign in
		</a>
		<a
			href={loginUrl('sign-up')}
			class="rounded-lg border border-neutral-300 px-5 py-2.5 font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
		>
			Create account
		</a>
	</div>
</main>
