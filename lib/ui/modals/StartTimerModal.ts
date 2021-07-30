import MyPlugin from 'main';
import { FuzzyMatch, FuzzySuggestModal } from 'obsidian';
import { TimeEntry } from '../../model/TimeEntry';
import TogglManager from '../../toggl/TogglManager';

export default class StartTimerModal extends FuzzySuggestModal<TimeEntry> {
	private readonly _toggl: TogglManager;
	private readonly _timeEntries: TimeEntry[];

	constructor(plugin: MyPlugin, timeEntries: TimeEntry[]) {
		super(plugin.app);
		this._toggl = plugin.toggl;
		this._timeEntries = this._removeRepeatedEntries(
			timeEntries != null ? timeEntries : []
		);
		this.setPlaceholder('Select a timer to restart...');
	}

	getItems(): TimeEntry[] {
		return this._timeEntries;
	}

	getItemText(item: TimeEntry): string {
		return `${item.description} (${item.project})`;
	}

	renderSuggestion(item: FuzzyMatch<TimeEntry>, el: HTMLElement): void {
		super.renderSuggestion(item, el);
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

	onChooseItem(item: TimeEntry, evt: MouseEvent | KeyboardEvent): void {
		this._toggl.startTimer(item).then((v: TimeEntry) => {
			console.log(v);
		});
		this.close();
	}

	private _removeRepeatedEntries(items: TimeEntry[]): TimeEntry[] {
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
		return items;
	}
}

function uniqueBy(array: any, cond: (a: any, b: any) => boolean) {
	return array.filter(
		(e1: any, i: number) => array.findIndex((e2: any) => cond(e1, e2)) === i
	);
}
