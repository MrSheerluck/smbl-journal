<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-42DGQ62KCE"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'G-42DGQ62KCE');
	</script>
</svelte:head>

{@render children()}
