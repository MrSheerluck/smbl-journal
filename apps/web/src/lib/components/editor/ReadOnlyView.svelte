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
	.read-only :global(.tiptap) {
		cursor: default;
	}
</style>
