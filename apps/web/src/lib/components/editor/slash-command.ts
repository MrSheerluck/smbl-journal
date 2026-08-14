import { Extension, type Editor, type Range } from '@tiptap/core';
import { Suggestion, type SuggestionProps } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';

export interface SlashItem {
	title: string;
	description: string;
	/** Short icon label rendered in the menu (emoji or 1-2 chars). */
	icon: string;
	keywords?: string[];
	action: (editor: Editor) => void;
}

export interface SlashMenuController {
	update(props: SuggestionProps<SlashItem>): void;
	onKeyDown(event: KeyboardEvent): boolean;
	destroy(): void;
}

/** A Svelte-side factory that renders + manages the slash dropdown DOM. */
export type SlashMenuFactory = (props: SuggestionProps<SlashItem>) => SlashMenuController;

export const SlashPluginKey = new PluginKey<unknown>('slashCommand');

const DEFAULT_ITEMS: Omit<SlashItem, 'action'>[] = [
	{ title: 'Text', description: 'Plain paragraph', icon: '¶', keywords: ['paragraph', 'p'] },
	{ title: 'Heading 1', description: 'Large section heading', icon: 'H1', keywords: ['title', 'h1'] },
	{ title: 'Heading 2', description: 'Medium section heading', icon: 'H2', keywords: ['h2'] },
	{ title: 'Heading 3', description: 'Small section heading', icon: 'H3', keywords: ['h3'] },
	{ title: 'Bullet list', description: 'Create a simple bullet list', icon: '•', keywords: ['ul', 'list'] },
	{ title: 'Numbered list', description: 'Create a numbered list', icon: '1.', keywords: ['ol', 'list'] },
	{ title: 'Task list', description: 'Track tasks with checkboxes', icon: '☑', keywords: ['todo', 'checkbox'] },
	{ title: 'Blockquote', description: 'Capture a quote', icon: '❝', keywords: ['quote'] },
	{ title: 'Code block', description: 'Capture a code snippet', icon: '</>', keywords: ['code', 'pre'] },
	{ title: 'Divider', description: 'Insert a horizontal rule', icon: '—', keywords: ['hr', 'line', 'separator'] },
	{ title: 'Bold', description: 'Make text bold', icon: 'B', keywords: ['strong'] },
	{ title: 'Italic', description: 'Make text italic', icon: 'I', keywords: ['em'] },
	{ title: 'Strikethrough', description: 'Strike through text', icon: 'S', keywords: ['strike'] },
	{ title: 'Inline code', description: 'Format text as code', icon: '`', keywords: ['code'] },
	{ title: 'Highlight', description: 'Mark text with a highlighter', icon: '🖍', keywords: ['mark'] },
	{ title: 'Clear formatting', description: 'Remove all formatting', icon: '⌫', keywords: ['clear', 'reset'] },
	{ title: 'Undo', description: 'Undo last change', icon: '↶', keywords: [] },
	{ title: 'Redo', description: 'Redo last change', icon: '↷', keywords: [] }
];

export function buildSlashItems(editor: Editor): SlashItem[] {
	const items: SlashItem[] = [];
	for (const def of DEFAULT_ITEMS) {
		let action: ((ed: Editor) => void) | null = null;
		switch (def.title) {
			case 'Text':
				action = (ed) => ed.chain().focus().setParagraph().run();
				break;
			case 'Heading 1':
				action = (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run();
				break;
			case 'Heading 2':
				action = (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run();
				break;
			case 'Heading 3':
				action = (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run();
				break;
			case 'Bullet list':
				action = (ed) => ed.chain().focus().toggleBulletList().run();
				break;
			case 'Numbered list':
				action = (ed) => ed.chain().focus().toggleOrderedList().run();
				break;
			case 'Task list':
				action = (ed) => ed.chain().focus().toggleTaskList().run();
				break;
			case 'Blockquote':
				action = (ed) => ed.chain().focus().toggleBlockquote().run();
				break;
			case 'Code block':
				action = (ed) => ed.chain().focus().toggleCodeBlock().run();
				break;
			case 'Divider':
				action = (ed) => ed.chain().focus().setHorizontalRule().run();
				break;
			case 'Bold':
				action = (ed) => ed.chain().focus().toggleBold().run();
				break;
			case 'Italic':
				action = (ed) => ed.chain().focus().toggleItalic().run();
				break;
			case 'Strikethrough':
				action = (ed) => ed.chain().focus().toggleStrike().run();
				break;
			case 'Inline code':
				action = (ed) => ed.chain().focus().toggleCode().run();
				break;
			case 'Highlight':
				action = (ed) => ed.chain().focus().toggleHighlight().run();
				break;
			case 'Clear formatting':
				action = (ed) => ed.chain().focus().unsetAllMarks().clearNodes().run();
				break;
			case 'Undo':
				action = (ed) => ed.chain().focus().undo().run();
				break;
			case 'Redo':
				action = (ed) => ed.chain().focus().redo().run();
				break;
		}
		if (action) items.push({ ...def, action });
	}
	return items;
}

function filterItems(items: SlashItem[], query: string): SlashItem[] {
	const q = query.trim().toLowerCase();
	if (!q) return items;
	return items.filter((item) => {
		const haystack = [item.title, item.description, ...(item.keywords ?? [])]
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}

export const SlashCommand = Extension.create({
	name: 'slashCommand',

	addOptions() {
		return {
			renderMenu: null as SlashMenuFactory | null
		};
	},

	addProseMirrorPlugins() {
		const editor = this.editor;
		const renderMenu = this.options.renderMenu;

		return [
			Suggestion({
				editor,
				pluginKey: SlashPluginKey,
				char: '/',
				startOfLine: true,
				allowedPrefixes: null,
				items: ({ query }) => filterItems(buildSlashItems(editor), query),
				command: ({ editor: ed, range, props }) => {
					ed.chain().focus().deleteRange(range).run();
					props.action(ed);
					ed.commands.focus();
				},
				render: () => {
					let controller: SlashMenuController | null = null;
					return {
						onStart(props) {
							if (!renderMenu) return;
							controller = renderMenu(props);
						},
						onUpdate(props) {
							controller?.update(props);
						},
						onExit() {
							controller?.destroy();
							controller = null;
						},
						onKeyDown({ event }) {
							return controller?.onKeyDown(event) ?? false;
						}
					};
				}
			})
		];
	}
});

export type { Range };
