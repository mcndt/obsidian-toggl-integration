import type { TimeEntry } from 'lib/model/TimeEntry';
import type MyPlugin from 'main';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import TogglSidebarPane from './TogglSidebarPane.svelte';

export const VIEW_TYPE_REPORT = 'toggl-report';

export default class TogglReportView extends ItemView {
	private readonly plugin: MyPlugin;

	private content: TogglSidebarPane;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	/* Obsidian event lifecycle */
	async onOpen(): Promise<void> {
		this.content = new TogglSidebarPane({
			target: this.contentEl,
			props: {}
		});
	}

	/* View abstract method implementations */

	getViewType(): string {
		return VIEW_TYPE_REPORT;
	}

	getDisplayText(): string {
		return 'Toggl Report';
	}

	getIcon(): string {
		return 'clock';
	}
}
