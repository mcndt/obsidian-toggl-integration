import { Project } from 'lib/model/Project';
import MyPlugin from 'main';
import { FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import { TimeEntry, TimeEntryStart } from '../../model/TimeEntry';

enum TimerListItemType {
	NEW_TIMER,
	PAST_ENTRY
}

interface TimerListItem {
	type: TimerListItemType;
	entry?: TimeEntry;
	textLeft?: string;
	textRight?: string;
	itemColor?: string;
}

export default class StartTimerModal extends FuzzySuggestModal<TimerListItem> {
	private readonly plugin: MyPlugin;
	private readonly list: TimerListItem[];

	constructor(plugin: MyPlugin, timeEntries: TimeEntry[]) {
		super(plugin.app);
		this.plugin = plugin;
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
			return `${item.textLeft} (${item.textRight})`;
		} else if (item.type === TimerListItemType.NEW_TIMER) {
			return `new timer`;
		}
		return ``;
	}

	renderSuggestion(item: FuzzyMatch<TimerListItem>, el: HTMLElement): void {
		super.renderSuggestion(item, el);
		el.innerHTML =
			`<div class="timer-search-item">` +
			`<span class="timer-search-description">` +
			`${item.item.textLeft}` +
			`</span>` +
			`<span class="timer-search-project">` +
			`${item.item.textRight}` +
			`<span class="timer-search-color" style="background-color:${
				item.item.itemColor || 'rgba(0,0,0,0)'
			}"></span></div>`;
	}

	updateSuggestionElForMode(item: FuzzyMatch<TimeEntry>, el: HTMLElement) {}

	async onChooseItem(
		item: TimerListItem,
		evt: MouseEvent | KeyboardEvent
	): Promise<void> {
		if (item.type === TimerListItemType.NEW_TIMER) {
			// Start a timer with a new description
			console.debug('Timer with new description');
			const project = await this.plugin.userInputHelper.letUserSelectProject();
			console.debug(`Project selected: ${project}`);
			const description =
				await this.plugin.userInputHelper.letUserEnterTimerDescription();
			console.debug(`Description entered: "${description}"`);
			const timer = this._createNewTimer(project, description);
			this.plugin.toggl.startTimer(timer).then((e: TimeEntry) => {
				console.debug('Restarting a past timer');
				console.debug(e);
				this.close();
			});
		} else if (item.type === TimerListItemType.PAST_ENTRY) {
			// Reuse a past timer
			this.plugin.toggl.startTimer(item.entry).then((e: TimeEntry) => {
				console.debug('Restarting a past timer');
				console.debug(e);
				this.close();
			});
		}
	}

	private _createNewTimer(
		project: Project,
		description: string
	): TimeEntryStart {
		return {
			description: description,
			pid: project != null ? parseInt(project.id) : null
		};
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
					textLeft: e.description,
					textRight: e.project || '(No Project)',
					itemColor: e.project_hex_color || '#CECECE'
				} as TimerListItem)
		);

		const newTimerItem: TimerListItem = {
			type: TimerListItemType.NEW_TIMER,
			textLeft: 'New timer...',
			textRight: ''
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
