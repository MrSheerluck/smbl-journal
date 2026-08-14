<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { buildEditorExtensions } from './extensions';

	let { content = '' }: { content?: string } = $props();

	let editorEl = $state<HTMLDivElement>();
	let editor: Editor | null = null;

	onMount(() => {
		editor = new Editor({
			element: editorEl,
			editable: false,
			extensions: buildEditorExtensions(),
			content,
			contentType: 'markdown'
		});
	});

	onDestroy(() => {
		editor?.destroy();
		editor = null;
	});
</script>

<div bind:this={editorEl} class="tiptap read-only"></div>

<style>
	.read-only {
		font-family: var(--entry-font, var(--font-serif));
		font-size: calc(1.0625rem * var(--entry-scale, 1));
		line-height: 1.75;
		color: var(--color-ink);
	}

	:global(.dark) .read-only {
		color: #f2f2f2;
	}

	.read-only :global(.tiptap) {
		cursor: default;
	}

	.read-only :global(.tiptap h1),
	.read-only :global(.tiptap h2),
	.read-only :global(.tiptap h3),
	.read-only :global(.tiptap h4),
	.read-only :global(.tiptap h5),
	.read-only :global(.tiptap h6) {
		font-family: var(--font-display);
		font-weight: 560;
		line-height: 1.2;
	}

	.read-only :global(.tiptap h1) {
		font-size: 1.75rem;
		margin-top: 1.25rem;
	}

	.read-only :global(.tiptap h2) {
		font-size: 1.375rem;
		margin-top: 1rem;
	}

	.read-only :global(.tiptap h3) {
		font-size: 1.1875rem;
		margin-top: 0.875rem;
	}

	.read-only :global(.tiptap p) {
		line-height: 1.75;
		margin-top: 0.6rem;
	}

	.read-only :global(.tiptap p:first-child) {
		margin-top: 0;
	}

	.read-only :global(.tiptap ul),
	.read-only :global(.tiptap ol) {
		padding-left: 1.25rem;
		line-height: 1.75;
		margin-top: 0.6rem;
	}

	.read-only :global(.tiptap blockquote) {
		border-left: 3px solid var(--color-thread-soft);
		padding-left: 1rem;
		color: var(--color-ink-soft);
		font-style: italic;
		margin: 0.6rem 0 0 0.25rem;
	}

	.read-only :global(.tiptap a) {
		color: var(--color-thread);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.read-only :global(.tiptap mark) {
		background: var(--color-thread-faint);
		border-radius: 0.25rem;
		padding: 0 0.15rem;
	}
</style>
