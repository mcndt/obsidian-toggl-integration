import type MyPlugin from 'main';
import type { Project } from 'lib/model/Project';
import type { TimeEntry } from 'lib/model/TimeEntry';
import type { TimeEntryStart } from 'lib/model/TimeEntry';
import type { TogglWorkspace } from 'lib/model/TogglWorkspace';
import type Report from 'lib/model/Report';
import { Notice } from 'obsidian';
import togglClient from 'toggl-client';
import {
	currentTimer,
	dailySummary,
	apiStatusStore,
	togglStore
} from 'lib/util/stores';
import moment from 'moment';
import { ACTIVE_TIMER_POLLING_INTERVAL } from 'lib/constants';

export enum ApiStatus {
	AVAILABLE,
	NO_TOKEN,
	UNREACHABLE,
	UNTESTED
}

export default class TogglManager {
	private _plugin: MyPlugin;

	// TODO: rewrite toggl API client with Obsidian Request API
	private _api: any;

	// UI references
	private _statusBarItem: HTMLElement;

	private _projects: Project[] = [];
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
				this._api = togglClient({
					apiToken: token,
					headers: {
						'user-agent':
							'Toggl Integration for Obsidian (https://github.com/mcndt/obsidian-toggl-integration)'
					}
				});
				await this.testConnection();
				this.startTimerInterval();
				this._ApiAvailable = ApiStatus.AVAILABLE;
				this._preloadWorkspaceData();
			} catch {
				this._statusBarItem.setText('Cannot connect to Toggl API');
				console.error('Cannot connect to toggl API.');
				this._ApiAvailable = ApiStatus.UNREACHABLE;
				console.debug('unreachable');
				this.noticeAPINotAvailable();
			}
		} else {
			this._statusBarItem.setText('Open settings to add a Toggl API token.');
			this._ApiAvailable = ApiStatus.NO_TOKEN;
			this.noticeAPINotAvailable();
		}
		apiStatusStore.set(this._ApiAvailable);
	}

	/** Preloads data such as the user's projects. */
	private async _preloadWorkspaceData() {
		// preload projects
		this.getProjects().then((response: Project[]) => {
			this._projects = response;
			console.debug('Preloaded projects');
		});
		// fetch daily summary report
		this.getDailySummary().then((response: Report) =>
			dailySummary.set(response)
		);
	}

	/** Throws an Error when the Toggl Track API cannot be reached. */
	public async testConnection() {
		// test by just making a small request to the API.
		// The method will throw an Error when we get a negative
		// response code.
		await this._api.workspaces.list();
	}

	/** @returns list of the user's workspaces. */
	public async getWorkspaces(): Promise<TogglWorkspace[]> {
		const response = await this._api.workspaces.list();
		return response.map(
			(w: any) =>
				({ id: (w.id as number).toString(), name: w.name } as TogglWorkspace)
		);
	}

	/**
	 * @returns list of the user's projects for the configured Toggl workspace.
	 * NOTE: this makes an async call to the Toggl API. To get cached projects,
	 * use the computed property cachedProjects instead.
	 */
	public async getProjects(): Promise<Project[]> {
		const response = await this._api.workspaces.projects(this.workspaceId);
		return response.map(
			(p: any) =>
				({
					name: p.name,
					id: p.id,
					cid: p.cid,
					active: p.active,
					actual_hours: p.actual_hours,
					hex_color: p.hex_color
				} as Project)
		);
	}

	/** @returns list of recent time entries for the user's workspace. */
	public async getRecentTimeEntries(): Promise<TimeEntry[]> {
		const response = await this._api.reports.details(this.workspaceId);
		console.debug('Toggl API response: recent time entries');
		return response.data.map(
			(e: any) =>
				({
					id: e.id,
					description: e.description,
					duration: e.dur,
					start: e.start,
					end: e.end,
					pid: e.pid,
					project: e.project,
					project_hex_color: e.project_hex_color,
					tags: e.tags
				} as TimeEntry)
		);
	}

	/**
	 * Fetches a report for the current day according to the Toggl Track Report API.
	 * @returns a {@link Report} object containing the report data as defined by
	 * the track report API
	 * (see https://github.com/toggl/toggl_api_docs/blob/master/reports.md).
	 *
	 * NOTE: this method is used to fetch the latest summary at key events. To
	 *       access the latest report, subscribe to the store {@link dailyReport}
	 */
	private async getDailySummary(): Promise<Report> {
		const response: Report = await this._api.reports.summary(this.workspaceId, {
			since: moment().toISOString().format('YYYY-MM-DD'),
			order_field: 'duration',
			order_desc: 'on'
		});
		return response;
	}

	/**
	 * Starts a new timer on Toggl Track with the given
	 * description and project.
	 * @param entry the description and project to start a timer on.
	 */
	public async startTimer(entry: TimeEntryStart): Promise<TimeEntry> {
		return this._api.timeEntries.start(entry);
	}

	/**
	 * Stops the currently running timer. If no timer is running,
	 * the promise will reject.
	 */
	public async stopTimer(): Promise<TimeEntry> {
		if (this._currentTimeEntry != null) {
			return this._api.timeEntries.stop(this._currentTimeEntry.id);
		}
		return Promise.reject('No timer is running.');
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
			const timers = await this.getRecentTimeEntries();
			console.dir(timers);
			new_timer = await this._plugin.input.selectTimer(timers);

			// user wants to start a new timer
			if (new_timer == null) {
				const project = await this._plugin.input.selectProject();
				const description = await this._plugin.input.enterTimerDescription();
				new_timer = {
					description: description,
					pid: project != null ? parseInt(project.id) : null
				};
			}

			this.startTimer(new_timer).then((t: TimeEntry) => {
				console.debug(`Started timer: ${t}`);
			});
		});
	}

	public async commandTimerStop() {
		this.executeIfAPIAvailable(() => {
			this.stopTimer();
		});
	}

	// TODO map API response to TimeEntry
	/**
	 * Start polling the Toggl Track API periodically to get the
	 * currently running timer.
	 */
	private startTimerInterval() {
		this._currentTimerInterval = window.setInterval(async () => {
			if (this._api == null) {
				return;
			}
			const prev = this._currentTimeEntry;
			let curr = await this._api.timeEntries.current();

			// TODO properly handle multiple workspaces
			// Drop timers from different workspaces
			if (
				curr != null &&
				curr.wid != this.workspaceId &&
				curr.pid != undefined
			) {
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
							prev.start != curr.start
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
				this.getDailySummary().then((response: Report) =>
					dailySummary.set(response)
				);
			}

			this._currentTimeEntry = curr;
			this.updateStatusBarText();
		}, ACTIVE_TIMER_POLLING_INTERVAL);
		this._plugin.registerInterval(this._currentTimerInterval);
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
		// If the time entry is not currently running, the duration field
		// contains the timer length in seconds.
		if (timeEntry.stop) {
			return timeEntry.duration;
		}
		// If the time entry is currently active, the duration field contains
		// the offset of the current unix epoch time to obtain the duration.
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

	/** True if API token is valid and Toggl API is responsive. */
	public get isApiAvailable(): boolean {
		if (this._ApiAvailable === ApiStatus.AVAILABLE) {
			return true;
		}
		return false;
	}

	/** User's projects as preloaded on plugin initialization. */
	public get cachedProjects(): Project[] {
		return this._projects;
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
			project_hex_color: project ? project.hex_color : 'var(--text-muted)'
		};
	}
}
