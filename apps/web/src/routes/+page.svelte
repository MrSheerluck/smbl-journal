<script lang="ts">

  let email = $state('');
  let status : 'idle' | 'sending' | 'success' | 'error' = $state('idle');
  let errorMsg = $state('');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function handleSubmit() {
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      status = 'error';
      errorMsg = 'Enter a valid email';
      return;
    }

    status = 'sending';
    errorMsg = '';

    setTimeout(() => {
      status = 'success';
      email = '';
    }, 900);

  }

</script>



<main
	class="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center text-neutral-900"
>
	<p class="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">smbl journal</p>
	<h1 class="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
		a private place to write.
	</h1>
	<p class="max-w-md text-base text-neutral-500">
	A text-based journal, encrypted end to end. The full writing experience is free forever
	</p>

	<form
		class="mt-2 flex w-full max-w-sm flex-col gap-2"
		novalidate
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
	>
		<div class="flex gap-2">
			<input
				type="email"
				bind:value={email}
				placeholder="you@example.com"
				disabled={status === 'sending'}
				class="w-full rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
			/>
			<button
				type="submit"
				disabled={status === 'sending'}
				class="shrink-0 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition enabled:hover:bg-neutral-700 disabled:opacity-50"
			>
				{status === 'sending' ? 'Joining…' : 'Join the waitlist'}
			</button>
		</div>

		<p class="text-sm" aria-live="polite">
			{#if status === 'error'}
				<span class="text-red-600">{errorMsg}</span>
			{:else if status === 'success'}
				<span class="text-emerald-600">You're on the list. We'll email you when it's live.</span>
			{/if}
		</p>
	</form>
</main>
