<script lang="ts">
	import { clearVault } from '$lib/vault';
</script>

<main class="flex min-h-screen flex-col">
	<div class="flex justify-end p-4">
		<form method="POST" action="/auth/logout" onsubmit={() => clearVault()}>
			<button
				type="submit"
				class="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
			>
				Sign out
			</button>
		</form>
	</div>
</main>
