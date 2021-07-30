import MyPlugin from 'main';
import { FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import { TimeEntry } from '../../model/TimeEntry';
import TogglManager from '../../toggl/TogglManager';

export default class StartTimerModal extends FuzzySuggestModal<TimeEntry> {
	private _toggl: TogglManager;
	private _timeEntries: TimeEntry[];

	constructor(plugin: MyPlugin) {
		super(plugin.app);
		this._toggl = plugin.toggl;
		this.setPlaceholder('Select a timer to restart...');
		this.setInstructions([
			{ command: '↑↓', purpose: 'Move up and down the list' },
			{ command: '↵', purpose: 'Start timer' },
			{ command: 'esc', purpose: 'Cancel' }
		]);
	}

	getItems(): TimeEntry[] {
		console.debug('Getting recent time entries');
		if (this._timeEntries == null) {
			return [];
		}
		// remove repeated entries
		let items = uniqueBy(this._timeEntries, (a: TimeEntry, b: TimeEntry) => {
			const cond1 = a.description === b.description;
			const cond2 = a.pid === b.pid;
			return cond1 && cond2;
		});
		// remove the entries with on description
		items = items.filter(
			(t: TimeEntry) => t.description != null && t.description != ''
		);
		return items;
	}

	getItemText(item: TimeEntry): string {
		return `${item.description} (${item.project})`;
	}

	onChooseItem(item: TimeEntry, evt: MouseEvent | KeyboardEvent): void {
		this._toggl.startTimer(item).then((v: TimeEntry) => {
			console.log(v);
		});
		this.close();
	}

	renderSuggestion(item: FuzzyMatch<TimeEntry>, el: HTMLElement): void {
		el.innerHTML =
			`<div class="timer-search-item">` +
			`<span class="timer-search-description">` +
			`${item.item.description}` +
			`</span>` +
			`<span class="timer-search-project">` +
			`${item.item.project || '(No project)'}` +
			`<span class="timer-search-color" style="background-color:${
				item.item.project_hex_color || 'rgba(0,0,0,0)'
			}"></span></div>`;
	}

	async onOpen() {
		let { contentEl } = this;
		this.inputEl.focus();
		this._timeEntries = await this._toggl.getRecentTimeEntries();
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}

function uniqueBy(array: any, cond: (a: any, b: any) => boolean) {
	return array.filter(
		(e1: any, i: number) => array.findIndex((e2: any) => cond(e1, e2)) === i
	);
}
