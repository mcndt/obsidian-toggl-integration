import type MyPlugin from 'main';
import type { TimeEntry } from '../../model/TimeEntry';
import { FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import StartTimerModalListItem from './StartTimerModalListItem.svelte';

enum TimerListItemType {
	NEW_TIMER,
	PAST_ENTRY
}

interface TimerListItem {
	type: TimerListItemType;
	entry?: TimeEntry;
	description?: string;
	project?: string;
	color?: string;
}

export default class StartTimerModal extends FuzzySuggestModal<TimerListItem> {
	private readonly resolve: (value: TimeEntry) => void;
	private readonly list: TimerListItem[];

	constructor(
		plugin: MyPlugin,
		resolve: (value: TimeEntry) => void,
		timeEntries: TimeEntry[]
	) {
		super(plugin.app);
		this.resolve = resolve;
		this.list = this._generateTimerList(timeEntries != null ? timeEntries : []);
		this.setPlaceholder('Select a timer to start');
		this.setInstructions([
			{ command: '↑↓', purpose: 'to navigate' },
			{ command: '⏎', purpose: 'Select project' },
			{ command: 'esc', purpose: 'cancel' }
		]);
	}

	getItems(): TimerListItem[] {
		return this.list;
	}

	getItemText(item: TimerListItem): string {
		if (item.type === TimerListItemType.PAST_ENTRY) {
			return `${item.description} (${item.project})`;
		} else if (item.type === TimerListItemType.NEW_TIMER) {
			return `new timer`;
		}
		return ``;
	}

	renderSuggestion(item: FuzzyMatch<TimerListItem>, el: HTMLElement): void {
		new StartTimerModalListItem({
			target: el,
			props: {
				description: item.item.description,
				project: item.item.project,
				color: item.item.color
			}
		});
	}

	updateSuggestionElForMode(item: FuzzyMatch<TimeEntry>, el: HTMLElement) {}

	async onChooseItem(
		item: TimerListItem,
		evt: MouseEvent | KeyboardEvent
	): Promise<void> {
		if (item.type === TimerListItemType.NEW_TIMER) {
			this.resolve(null);
		} else if (item.type === TimerListItemType.PAST_ENTRY) {
			this.resolve(item.entry);
		}
		this.close();
	}

	private _generateTimerList(items: TimeEntry[]): TimerListItem[] {
		// remove repeated entries
		items = uniqueBy(items, (a: TimeEntry, b: TimeEntry) => {
			const cond1 = a.description === b.description;
			const cond2 = a.pid === b.pid;
			return cond1 && cond2;
		});
		// remove the entries without a description
		items = items.filter(
			(t: TimeEntry) => t.description != null && t.description != ''
		);

		let list: TimerListItem[] = items.map(
			(e: TimeEntry) =>
				({
					type: TimerListItemType.PAST_ENTRY,
					entry: e,
					description: e.description,
					project: e.project || '(No Project)',
					color: e.project_hex_color || '#CECECE'
				} as TimerListItem)
		);

		const newTimerItem: TimerListItem = {
			type: TimerListItemType.NEW_TIMER,
			description: 'New timer...',
			project: ''
		};

		list = [newTimerItem].concat(list);

		return list;
	}
}

function uniqueBy(array: any, cond: (a: any, b: any) => boolean) {
	return array.filter(
		(e1: any, i: number) => array.findIndex((e2: any) => cond(e1, e2)) === i
	);
}
