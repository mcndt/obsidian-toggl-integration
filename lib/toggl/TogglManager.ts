import type MyPlugin from 'main';
import type { Project } from 'lib/model/Project';
import type { TimeEntry } from 'lib/model/TimeEntry';
import type { TimeEntryStart } from 'lib/model/TimeEntry';
import type { TogglWorkspace } from 'lib/model/TogglWorkspace';
import type { Detailed, Report, Summary } from 'lib/model/Report';
import { Notice } from 'obsidian';

import {
	currentTimer,
	dailySummary,
	apiStatusStore,
	togglStore
} from 'lib/util/stores';
import { ACTIVE_TIMER_POLLING_INTERVAL } from 'lib/constants';
import type { Tag } from 'lib/model/Tag';
import ApiManager from './ApiManager';
import type { Query } from 'lib/reports/ReportQuery';

export enum ApiStatus {
	AVAILABLE,
	NO_TOKEN,
	UNREACHABLE,
	UNTESTED
}

export default class TogglManager {
	private _plugin: MyPlugin;

	// TODO: rewrite toggl API client with Obsidian Request API
	// private _api: any;
	private _apiManager: ApiManager;

	// UI references
	private _statusBarItem: HTMLElement;

	private _projects: Project[] = [];
	private _tags: Tag[] = [];
	private _currentTimerInterval: number = null;
	private _currentTimeEntry: TimeEntry = null;
	private _ApiAvailable = ApiStatus.UNTESTED;

	constructor(plugin: MyPlugin) {
		this._plugin = plugin;
		this._statusBarItem = this._plugin.addStatusBarItem();
		this._statusBarItem.setText('Connecting to Toggl...');
		this.addCommands();
		// Store a reference to the manager in a svelte store to avoid passing
		// of references around the component trees.
		togglStore.set(this);
		apiStatusStore.set(ApiStatus.UNTESTED);
	}

	/**
	 * Creates a new toggl client object using the passed API token.
	 * @param token the API token for the client.
	 */
	public async setToken(token: string) {
		window.clearInterval(this._currentTimerInterval);
		if (token != null && token != '') {
			try {
				this._apiManager = new ApiManager();
				this._apiManager.initialize(token);
				this._ApiAvailable = ApiStatus.AVAILABLE;
				this.startTimerInterval();
				this._preloadWorkspaceData();
			} catch {
				console.error('Cannot connect to toggl API.');
				this._statusBarItem.setText('Cannot connect to Toggl API');
				this._ApiAvailable = ApiStatus.UNREACHABLE;
				this.noticeAPINotAvailable();
			}
		} else {
			this._statusBarItem.setText('Open settings to add a Toggl API token.');
			this._ApiAvailable = ApiStatus.NO_TOKEN;
			this.noticeAPINotAvailable();
		}
		apiStatusStore.set(this._ApiAvailable);
	}

	/** Throws an Error when the Toggl Track API cannot be reached. */
	public async testConnection() {
		await this._apiManager.testConnection();
	}

	/** @returns list of the user's workspaces. */
	public async getWorkspaces(): Promise<TogglWorkspace[]> {
		return this._apiManager.getWorkspaces();
	}

	/** Preloads data such as the user's projects. */
	private async _preloadWorkspaceData() {
		this._apiManager.getProjects().then((response: Project[]) => {
			this._projects = response;
		});
		this._apiManager.getTags().then((response: Tag[]) => {
			this._tags = response;
		});
		this._apiManager
			.getDailySummary()
			.then((response: Report<Summary>) => dailySummary.set(response));
	}

	/** Register Toggl commands for the Obsidian command palette. */
	private async addCommands() {
		// start timer command
		this._plugin.addCommand({
			id: 'start-timer',
			name: 'Start Toggl Timer',
			icon: 'clock',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					this.commandTimerStart();
				} else {
					return true;
				}
			}
		});

		// stop timer command
		this._plugin.addCommand({
			id: 'stop-timer',
			name: 'Stop Toggl Timer',
			icon: 'clock',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					this.commandTimerStop();
				} else {
					return this._currentTimeEntry != null;
				}
			}
		});
	}

	public async commandTimerStart() {
		this.executeIfAPIAvailable(async () => {
			let new_timer: TimeEntryStart;
			const timers = await this._apiManager.getRecentTimeEntries();
			new_timer = await this._plugin.input.selectTimer(timers);

			// user wants to start a new timer
			if (new_timer == null) {
				const project = await this._plugin.input.selectProject();
				new_timer = await this._plugin.input.enterTimerDetails();
				new_timer.pid = project != null ? parseInt(project.id) : null;
			}

			this._apiManager.startTimer(new_timer).then((t: TimeEntry) => {
				console.debug(`Started timer: ${t}`);
				this.updateCurrentTimer();
			});
		});
	}

	public async commandTimerStop() {
		this.executeIfAPIAvailable(() => {
			if (this._currentTimeEntry != null) {
				this._apiManager.stopTimer(this._currentTimeEntry.id).then(() => {
					this.updateCurrentTimer();
				});
			}
		});
	}

	/**
	 * Start polling the Toggl Track API periodically to get the
	 * currently running timer.
	 */
	private startTimerInterval() {
		this.updateCurrentTimer();
		this._currentTimerInterval = window.setInterval(() => {
			this.updateCurrentTimer();
		}, ACTIVE_TIMER_POLLING_INTERVAL);
		this._plugin.registerInterval(this._currentTimerInterval);
	}

	private async updateCurrentTimer() {
		if (!this.isApiAvailable) {
			return;
		}
		const prev = this._currentTimeEntry;
		let curr: any;

		try {
			curr = await this._apiManager.getCurrentTimer();
		} catch (err) {
			console.error('Error reaching Toggl API');
			console.error(err);
			return;
		}

		// TODO properly handle multiple workspaces
		// Drop timers from different workspaces
		if (curr != null && curr.wid != this.workspaceId && curr.pid != undefined) {
			curr = null;
		}

		let changed = false;

		if (curr != null) {
			if (prev == null) {
				// Case 1: no timer -> active timer
				changed = true;
				console.debug('Case 1: no timer -> active timer');
			} else {
				if (prev.id != curr.id) {
					// Case 2: old timer -> new timer (new ID)
					changed = true;
					console.debug('Case 2: old timer -> new timer (new ID)');
				} else {
					if (
						prev.description != curr.description ||
						prev.pid != curr.pid ||
						prev.start != curr.start ||
						isTagsChanged(prev.tags, curr.tags)
					) {
						// Case 3: timer details update (same ID)
						changed = true;
						console.debug('Case 3: timer details update (same ID)');
					}
				}
			}
		} else if (prev != null) {
			// Case 4: active timer -> no timer
			changed = true;
			console.debug('Case 4: active timer -> no timer');
		}

		if (changed) {
			const val = curr != null ? this.responseToTimeEntry(curr) : null;
			currentTimer.set(val);
			// fetch updated daily summary report
			this._apiManager
				.getDailySummary()
				.then((response: Report<Summary>) => dailySummary.set(response));
		}

		this._currentTimeEntry = curr;
		this.updateStatusBarText();
	}

	/**
	 * Updates the status bar text to reflect the current Toggl
	 * state (e.g. details of current timer).
	 */
	private updateStatusBarText() {
		let timer_msg = null;
		if (this._currentTimeEntry == null) {
			timer_msg = '-';
		} else {
			let title: string =
				this._currentTimeEntry.description || 'No description';
			if (title.length > this._plugin.settings.charLimitStatusBar) {
				title = `${title.slice(
					0,
					this._plugin.settings.charLimitStatusBar - 3
				)}...`;
			}
			const duration = this.getTimerDuration(this._currentTimeEntry);
			const minutes = Math.floor(duration / 60);
			const time_string = `${minutes} minute${minutes != 1 ? 's' : ''}`;
			timer_msg = `${title} (${time_string})`;
		}
		this._statusBarItem.setText(`Timer: ${timer_msg}`);
	}

	/**
	 * @param timeEntry TimeEntry object as returned by the Toggl Track API
	 * @returns timer duration in seconds
	 */
	private getTimerDuration(timeEntry: any): number {
		if (timeEntry.stop) {
			return timeEntry.duration;
		}
		// true_duration = epoch_time + duration
		const epoch_time = Math.round(new Date().getTime() / 1000);
		return epoch_time + timeEntry.duration;
	}

	/** Runs the passed function if the API is available, else emits a notice. */
	private executeIfAPIAvailable(func: Function) {
		if (this.isApiAvailable) {
			func();
		} else {
			this.noticeAPINotAvailable();
		}
	}

	private noticeAPINotAvailable() {
		switch (this._ApiAvailable) {
			case ApiStatus.NO_TOKEN:
				new Notice('No Toggl Track API token is set.');
				break;
			case ApiStatus.UNREACHABLE:
				new Notice(
					'The Toggl Track API is unreachable. Either the Toggl services are down, or your API token is incorrect.'
				);
				break;
		}
	}

	/**
	 * Fullfills a query for Toggl Track reports and returns the report object.
	 */
	// TODO: these generics are awful...
	// public async getReport(query: Query): Promise<{summary: Report<Summary>, detailed: Report<Detailed>}> {
	// 	if (query.type === QueryType.SUMMARY) {
	// 		return this._apiManager.getSummary(query.from, query.to);
	// 	} else if (query.type === QueryType.LIST) {
	// 		throw new Error('List queries are not yet implemented.');
	// 	} else {
	// 		throw new Error(
	// 			`There is no query implementation for type ${query.type}.`
	// 		);
	// 	}
	// }

	/**
	 * Gets a Toggl Summary report based on the query parameter.
	 * @param query query to be fullfilled.
	 * @returns Summary report returned by Toggl API.
	 */
	public async getSummaryReport(query: Query): Promise<Report<Summary>> {
		return this._apiManager.getSummary(query.from, query.to);
	}

	/**
	 * Gets a Toggl Detailed report based on the query parameter.
	 * Makes multiple HTTP requests until all pages of the paginated result are
	 * gathered, then returns the combined report as a single object.
	 * @param query query to be fullfilled.
	 * @returns Summary report returned by Toggl API.
	 */
	public async GetDetailedReport(query: Query): Promise<Report<Detailed>> {
		const page0 = await this._apiManager.getDetailedReport(
			query.from,
			query.to,
			0
		);

		if (page0.total_count <= page0.per_page) {
			return page0;
		}

		const nPages = Math.ceil(page0.total_count / page0.per_page);
		let pages: Report<Detailed>[];

		if (nPages <= 8) {
			console.debug(`Requesting ${nPages} time entry pages in parallel mode.`);
			const promises: Promise<Report<Detailed>>[] = [];
			for (let i = 2; i <= nPages; i++) {
				promises.push(
					this._apiManager.getDetailedReport(query.from, query.to, i)
				);
			}
			pages = await Promise.all(promises);
		} else {
			console.debug(`Requesting ${nPages} time entry pages in batch mode.`);
			// Stagger requests to avoid HTTP 429 Too Many Requests
			const batchSize = 10;
			const nBatches = Math.ceil(nPages / batchSize);

			pages = [];
			for (let batch = 0; batch < nBatches; batch++) {
				const promises: Promise<Report<Detailed>>[] = [];
				for (
					let i = Math.max(2, batch * batchSize);
					i <= Math.min(nPages, (batch + 1) * batchSize - 1);
					i++
				) {
					promises.push(
						this._apiManager.getDetailedReport(query.from, query.to, i)
					);
					const newPages = await Promise.all(promises);
					pages = pages.concat(newPages);
				}
			}
		}

		const completeReport = pages.reduce((prevPage, currPage) => {
			prevPage.data = prevPage.data.concat(currPage.data);
			return prevPage;
		}, page0);

		// Sometimes the Toggl API returns duplicate entries,
		// need to deduplicate by entry id
		completeReport.data = completeReport.data.filter(
			(el, index, self) => index === self.findIndex((el2) => el2.id === el.id)
		);

		return completeReport;
	}

	/** True if API token is valid and Toggl API is responsive. */
	public get isApiAvailable(): boolean {
		if (this._ApiAvailable === ApiStatus.AVAILABLE) {
			return true;
		}
		return false;
	}

	/** User's projects as preloaded on plugin init. */
	public get cachedProjects(): Project[] {
		return this._projects;
	}

	/** User's workspace tags as preloaded on plugin init */
	public get cachedTags(): Tag[] {
		return this._tags;
	}

	private get workspaceId(): string {
		return this._plugin.settings.workspace.id;
	}

	// NOTE: relies on cached projects for project names
	private responseToTimeEntry(response: any): TimeEntry {
		let project = this.cachedProjects.find((p) => p.id == response.pid);
		return {
			description: response.description,
			pid: response.pid,
			id: response.id,
			duration: response.duration,
			start: response.start,
			end: response.end,
			project:
				response.pid != undefined
					? project
						? project.name
						: '(Unknown)'
					: '(No project)',
			project_hex_color: project ? project.hex_color : 'var(--text-muted)',
			tags: response.tags
		};
	}
}

function isTagsChanged(old_tags: string[], new_tags: string[]) {
	old_tags = old_tags || [];
	new_tags = new_tags || [];

	if (old_tags.length != new_tags.length) {
		return true;
	}
	for (const tag of old_tags) {
		if (new_tags.indexOf(tag) < 0) {
			return true;
		}
	}
	return false;
}
