<script lang="ts">
	import { page } from '$app/state';
	import Calendar from './Calendar.svelte';

	interface Props {
		open?: boolean;
		onClose?: () => void;
		onOpenSettings?: () => void;
	}
	let { open = false, onClose, onOpenSettings }: Props = $props();

	interface NavItem {
		href?: string;
		label: string;
		icon: string;
	}

	const items: NavItem[] = [{ href: '/home', label: 'Today', icon: 'feather' }];

	const ICONS: Record<string, string> = {
		feather:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>',
		gear:
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
	};

	let collapsed = $state(false);

	function isActive(href: string): boolean {
		return page.url.pathname === href;
	}

	function toggle() {
		collapsed = !collapsed;
	}

	function handleNav() {
		onClose?.();
	}
</script>

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
		aria-label="Close menu"
		onclick={handleNav}
	></button>
{/if}

<aside
	class="fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col overflow-y-auto border-r border-rule transition-transform duration-200 lg:static lg:z-auto lg:transition-none dark:border-rule-dark {collapsed ? 'w-16 bg-paper/60 dark:bg-[#141414]/60' : 'w-64 bg-paper-2/60 dark:bg-[#1b1b1b]/60'} {open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}"
>
	<div class="flex items-center justify-between px-2.5 lg:justify-end lg:gap-1">
		<button
			type="button"
			onclick={handleNav}
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-paper hover:text-ink lg:hidden dark:hover:bg-[#2c2c2c] dark:hover:text-[#f2f2f2]"
			aria-label="Close menu"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
		<button
			type="button"
			onclick={toggle}
			class="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-paper hover:text-ink lg:flex dark:hover:bg-[#2c2c2c] dark:hover:text-[#f2f2f2]"
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			{#if collapsed}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M9 18l6-6-6-6" />
				</svg>
			{:else}
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M15 6l-6 6 6 6" />
				</svg>
			{/if}
		</button>
	</div>

	<nav class="mt-6 flex flex-col gap-1 px-2.5">
	{#each items as item (item.label)}
		<a
			href={item.href}
			onclick={handleNav}
			class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
			class:justify-center={collapsed}
			class:px-1.5={collapsed}
			class:bg-thread-faint={item.href && isActive(item.href)}
			class:text-thread={item.href && isActive(item.href)}
			class:text-ink-2={!item.href || !isActive(item.href)}
			class:hover:bg-paper={!item.href || !isActive(item.href)}
			class:dark:hover:bg-[#2c2c2c]={!item.href || !isActive(item.href)}
		>
			<span class="flex h-4 w-4 shrink-0 items-center justify-center">
				{@html ICONS[item.icon]}
			</span>
			{#if !collapsed}
				<span>{item.label}</span>
			{/if}
		</a>
	{/each}

	<button
		type="button"
		onclick={() => {
			handleNav();
			onOpenSettings?.();
		}}
		class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition text-ink-2 hover:bg-paper dark:hover:bg-[#2c2c2c]"
		class:justify-center={collapsed}
		class:px-1.5={collapsed}
	>
		<span class="flex h-4 w-4 shrink-0 items-center justify-center">
			{@html ICONS['gear']}
		</span>
		{#if !collapsed}
			<span>Settings</span>
		{/if}
	</button>
</nav>

	{#if !collapsed}
		<div class="mt-auto">
			<div class="mx-2.5 mb-1 h-px bg-rule dark:bg-rule-dark"></div>
			<Calendar />
		</div>
	{/if}
</aside>
