<script lang="ts">
	import { onMount, onDestroy, mount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import { BubbleMenu } from '@tiptap/extension-bubble-menu';
	import type { SuggestionProps } from '@tiptap/suggestion';
	import { buildEditorExtensions } from './extensions';
	import type { SlashItem, SlashMenuController } from './slash-command';
	import SlashMenu from './SlashMenu.svelte';
	import ToolButton from './ToolButton.svelte';

	interface Props {
		content?: string;
		reloadKey?: string;
		placeholder?: string;
		autofocus?: boolean;
		onChange?: (markdown: string) => void;
	}

	let {
		content = '',
		reloadKey = 'initial',
		placeholder,
		autofocus = false,
		onChange
	}: Props = $props();

	let editorEl = $state<HTMLDivElement>();
	let bubbleEl = $state<HTMLDivElement>();
	let editor = $state<Editor | null>(null);
	let version = $state(0);
	let isEmpty = $state(true);
	let focused = $state(false);

	let appliedKey: string | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	let menuInstance: {
		update?: (props: { items: SlashItem[]; onSelect: (item: SlashItem) => void }) => void;
		handleKeyDown?: (event: KeyboardEvent) => boolean;
	} | null = null;
	let menuEl: HTMLDivElement | null = null;
	let unmountMenu: (() => void) | null = null;

	function createSlashMenu(props: SuggestionProps<SlashItem>): SlashMenuController {
		menuEl = document.createElement('div');
		menuInstance = mount(SlashMenu, {
			target: menuEl,
			props: {
				items: props.items,
				onSelect: (item: SlashItem) => props.command(item)
			}
		});
		unmountMenu = props.mount(menuEl);
		return {
			update: (p) => {
				menuInstance?.update?.({ items: p.items, onSelect: (item) => p.command(item) });
			},
			onKeyDown: (event) => menuInstance?.handleKeyDown?.(event) ?? false,
			destroy: () => {
				unmountMenu?.();
				unmountMenu = null;
				menuInstance = null;
				menuEl = null;
			}
		};
	}

	onMount(() => {
		appliedKey = reloadKey;
		editor = new Editor({
			element: editorEl,
			extensions: [
				...buildEditorExtensions({ placeholder, slashMenu: createSlashMenu }),
				BubbleMenu.configure({
					element: bubbleEl,
					shouldShow: ({ editor: ed }) => {
						if (ed.isActive('codeBlock')) return false;
						return !ed.state.selection.empty;
					}
				})
			],
			content,
			contentType: 'markdown',
			autofocus: autofocus ? 'end' : false,
			onFocus: () => (focused = true),
			onBlur: () => (focused = false),
			onTransaction: () => {
				version += 1;
				isEmpty = editor?.isEmpty ?? true;
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					onChange?.(editor?.getMarkdown() ?? '');
				}, 400);
			}
		});
	});

	onDestroy(() => {
		clearTimeout(debounceTimer);
		unmountMenu?.();
		editor?.destroy();
		editor = null;
	});

	$effect(() => {
		if (!editor) return;
		if (reloadKey !== appliedKey) {
			appliedKey = reloadKey;
			editor.commands.setContent(content || '', { contentType: 'markdown' });
			editor.commands.focus('end');
		}
	});

	function run(fn: (ed: Editor) => void) {
		if (!editor) return;
		fn(editor);
		editor.commands.focus();
	}

	function toggleHeading(level: 1 | 2 | 3) {
		run((ed) => ed.chain().toggleHeading({ level }).run());
	}

	function isHeading(level: 1 | 2 | 3) {
		return editor?.isActive('heading', { level }) ?? false;
	}

	function toggleLink() {
		if (!editor) return;
		if (editor.isActive('link')) {
			editor.chain().focus().unsetLink().run();
			return;
		}
		const url = window.prompt('Link URL', 'https://');
		if (url === null) return;
		editor.chain().focus().setLink({ href: url }).run();
	}
</script>

<div class="rich-editor relative flex flex-col">
	<div class="toolbar flex flex-wrap items-center gap-0.5 border-b border-rule px-2 py-1.5 dark:border-rule-dark" data-version={version}>
		<ToolButton icon="undo" label="Undo" onclick={() => run((ed) => ed.chain().undo().run())} disabled={!editor?.can().undo()} />
		<ToolButton icon="redo" label="Redo" onclick={() => run((ed) => ed.chain().redo().run())} disabled={!editor?.can().redo()} />
		<div class="mx-1 h-5 w-px bg-rule dark:bg-rule-dark"></div>
		<ToolButton icon="h1" label="Heading 1" active={isHeading(1)} onclick={() => toggleHeading(1)} />
		<ToolButton icon="h2" label="Heading 2" active={isHeading(2)} onclick={() => toggleHeading(2)} />
		<ToolButton icon="h3" label="Heading 3" active={isHeading(3)} onclick={() => toggleHeading(3)} />
		<div class="mx-1 h-5 w-px bg-rule dark:bg-rule-dark"></div>
		<ToolButton icon="bold" label="Bold" active={editor?.isActive('bold') ?? false} onclick={() => run((ed) => ed.chain().toggleBold().run())} />
		<ToolButton icon="italic" label="Italic" active={editor?.isActive('italic') ?? false} onclick={() => run((ed) => ed.chain().toggleItalic().run())} />
		<ToolButton icon="underline" label="Underline" active={editor?.isActive('underline') ?? false} onclick={() => run((ed) => ed.chain().toggleUnderline().run())} />
		<ToolButton icon="strike" label="Strikethrough" active={editor?.isActive('strike') ?? false} onclick={() => run((ed) => ed.chain().toggleStrike().run())} />
		<ToolButton icon="code" label="Inline code" active={editor?.isActive('code') ?? false} onclick={() => run((ed) => ed.chain().toggleCode().run())} />
		<ToolButton icon="codeblock" label="Code block" active={editor?.isActive('codeBlock') ?? false} onclick={() => run((ed) => ed.chain().toggleCodeBlock().run())} />
		<div class="mx-1 h-5 w-px bg-rule dark:bg-rule-dark"></div>
		<ToolButton icon="bulletlist" label="Bullet list" active={editor?.isActive('bulletList') ?? false} onclick={() => run((ed) => ed.chain().toggleBulletList().run())} />
		<ToolButton icon="orderedlist" label="Numbered list" active={editor?.isActive('orderedList') ?? false} onclick={() => run((ed) => ed.chain().toggleOrderedList().run())} />
		<ToolButton icon="tasklist" label="Task list" active={editor?.isActive('taskList') ?? false} onclick={() => run((ed) => ed.chain().toggleTaskList().run())} />
		<ToolButton icon="quote" label="Blockquote" active={editor?.isActive('blockquote') ?? false} onclick={() => run((ed) => ed.chain().toggleBlockquote().run())} />
		<div class="mx-1 h-5 w-px bg-rule dark:bg-rule-dark"></div>
		<ToolButton icon="hr" label="Horizontal rule" onclick={() => run((ed) => ed.chain().setHorizontalRule().run())} />
		<ToolButton icon="link" label="Link" active={editor?.isActive('link') ?? false} onclick={toggleLink} />
		<ToolButton icon="highlight" label="Highlight" active={editor?.isActive('highlight') ?? false} onclick={() => run((ed) => ed.chain().toggleHighlight().run())} />
		<ToolButton icon="erase" label="Clear formatting" onclick={() => run((ed) => ed.chain().unsetAllMarks().clearNodes().run())} />
	</div>

	<div bind:this={editorEl} class="tiptap focus:outline-none"></div>

	{#if editor && isEmpty && focused}
		<div class="slash-hint pointer-events-none absolute bottom-3 left-6 font-mono text-xs text-ink-soft dark:text-[#8b887d]">
			Type "/" for commands
		</div>
	{/if}

	{#if editor}
	<div bind:this={bubbleEl} class="bubble-menu pointer-events-auto flex items-center gap-0.5 rounded-xl border border-rule bg-paper p-1 shadow-xl dark:border-rule-dark dark:bg-[#20211d]" hidden>
			<ToolButton size="sm" icon="bold" label="Bold" onclick={() => run((ed) => ed.chain().toggleBold().run())} />
			<ToolButton size="sm" icon="italic" label="Italic" onclick={() => run((ed) => ed.chain().toggleItalic().run())} />
			<ToolButton size="sm" icon="strike" label="Strikethrough" onclick={() => run((ed) => ed.chain().toggleStrike().run())} />
			<ToolButton size="sm" icon="code" label="Inline code" onclick={() => run((ed) => ed.chain().toggleCode().run())} />
			<div class="mx-1 h-4 w-px bg-rule dark:bg-rule-dark"></div>
			<ToolButton size="sm" icon="link" label="Link" onclick={toggleLink} />
			<ToolButton size="sm" icon="highlight" label="Highlight" onclick={() => run((ed) => ed.chain().toggleHighlight().run())} />
		</div>
	{/if}
</div>

<style>
	.bubble-menu[hidden] {
		display: none;
	}

	.slash-hint {
		animation: slash-hint-in 0.15s ease-out;
	}

	@keyframes slash-hint-in {
		from {
			opacity: 0;
			transform: translateY(2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
