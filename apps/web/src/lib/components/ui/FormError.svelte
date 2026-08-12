<script lang="ts">
	let { message }: { message?: string | null } = $props();
</script>

{#if message}
	<p class="text-xs text-red-500">{message}</p>
{/if}
