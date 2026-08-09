<script lang="ts">

  let email = $state('');
  let status : 'idle' | 'sending' | 'success' | 'error' = $state('idle');
  let errorMsg = $state('');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      status = 'error';
      errorMsg = 'Enter a valid email';
      return;
    }

    status = 'sending';
    errorMsg = '';

    try {
      const res = await fetch('http://localhost:8080/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      })
      if (res.ok) {
        status = 'success';
        email = '';
      } else {
        status = 'error';
        errorMsg = 'Failed to submit';
      }
    } catch (e) {
      status = 'error';
      errorMsg = 'Failed to submit';
    }

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
	<a
		href="https://github.com/MrSheerluck/smbl-journal"
		target="_blank"
		rel="noopener"
		class="flex items-center gap-2 text-sm text-neutral-400 transition hover:text-neutral-900"
	>
		<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 fill-current">
			<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
		</svg>
		open source on github
	</a>


</main>
