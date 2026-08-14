import { Extension, type Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Underline } from '@tiptap/extension-underline';
import { Typography } from '@tiptap/extension-typography';
import { Link } from '@tiptap/extension-link';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Highlight } from '@tiptap/extension-highlight';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { SlashCommand, type SlashMenuFactory } from './slash-command';

export function looksLikeMarkdown(text: string): boolean {
	if (/^(#{1,6}\s|>\s|[-*+]\s|\d+\.\s|\[[ xX]\]\s|```|~~~)/m.test(text)) return true;
	if (/\[[^\]]*\]\([^)]*\)|(\*\*|__|~~|`)/.test(text)) return true;
	if (text.includes('\n') && /^([-*_~`#>|]|\s*$)/m.test(text)) return true;
	return false;
}

const MarkdownPaste = Extension.create({
	name: 'markdownPaste',

	addProseMirrorPlugins() {
		const editor: Editor = this.editor;
		return [
			new Plugin({
				key: new PluginKey('markdownPaste'),
				props: {
					handlePaste(view, event) {
						const clipboard = event.clipboardData;
						if (!clipboard || !clipboard.types?.includes('text/plain')) return false;
						if (clipboard.types.includes('text/html')) return false;
						const text = clipboard.getData('text/plain');
						if (!text.trim() || !looksLikeMarkdown(text)) return false;
						const { from, to } = view.state.selection;
						if (from == null) return false;
						editor.chain().insertContentAt({ from, to }, text, { contentType: 'markdown' }).run();
						return true;
					}
				}
			})
		];
	}
});

export interface EditorExtensionsOptions {
	placeholder?: string;
	slashMenu?: SlashMenuFactory;
}

export function buildEditorExtensions({ placeholder, slashMenu }: EditorExtensionsOptions = {}) {
	return [
		StarterKit.configure({
			heading: { levels: [1, 2, 3, 4, 5, 6] }
		}),
		Markdown,
		Underline,
		Typography,
		Link.configure({
			openOnClick: false,
			autolink: true,
			linkOnPaste: true,
			defaultProtocol: 'https'
		}),
		TaskList,
		TaskItem.configure({ nested: true }),
		Highlight,
		Placeholder.configure({
			placeholder: placeholder ?? "Write what's on your mind..."
		}),
		MarkdownPaste,
		SlashCommand.configure({
			renderMenu: slashMenu
		})
	];
}
