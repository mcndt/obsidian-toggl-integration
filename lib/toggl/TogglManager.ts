import MyPlugin from 'main';
import { Notice } from 'obsidian';
import togglClient from 'toggl-client';
import { TimeEntry } from '../model/TimeEntry';
import { TimeEntryStart } from '../model/TimeEntry';
import { TogglWorkspace } from '../model/TogglWorkspace';
import StartTimerModal from '../ui/modals/StartTimerModal';

enum ApiStatus {
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

	private _currentTimerInterval: number = null;
	private _currentTimeEntry: any = null;
	private _ApiAvailable = ApiStatus.UNTESTED;

	constructor(plugin: MyPlugin) {
		this._plugin = plugin;
		this._statusBarItem = this._plugin.addStatusBarItem();
		this.addCommands();
	}

	/**
	 * Creates a new toggl client object using the passed API token.
	 * @param token the API token for the client.
	 */
	public async setToken(token: string) {
		window.clearInterval(this._currentTimerInterval);
		if (token != null && token != '') {
			try {
				this._api = togglClient({ apiToken: token });
				await this.testConnection();
				this.startTimerInterval();
				this._ApiAvailable = ApiStatus.AVAILABLE;
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

	/** @returns list of recent time entries for the user's workspace. */
	public async getRecentTimeEntries(): Promise<TimeEntry[]> {
		const response = await this._api.reports.details(
			this._plugin.settings.workspace.id
		);
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
					project_hex_color: e.project_hex_color
				} as TimeEntry)
		);
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
		// restart timer command
		this._plugin.addCommand({
			id: 'start-timer',
			name: 'Start Toggl Timer',
			icon: 'clock',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					this.executeIfAPIAvailable(() => {
						new StartTimerModal(this._plugin).open();
					});
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
					this.executeIfAPIAvailable(() => {
						this.stopTimer();
					});
				} else {
					return this._currentTimeEntry != null;
				}
			}
		});
	}

	/**
	 * Start polling the Toggl Track API periodically to get the
	 * currently running timer.
	 */
	private startTimerInterval() {
		this._currentTimerInterval = window.setInterval(async () => {
			if (this._api == null) {
				return;
			}
			const current = await this._api.timeEntries.current();
			if (
				current != null &&
				(this._currentTimeEntry == null ||
					this._currentTimeEntry.id != current.id)
			) {
				console.info(`New active Toggl timer (id: ${current.id})`);
			} else if (this._currentTimeEntry != null && current == null) {
				console.info('Stopped active Toggl timer.');
			}
			this._currentTimeEntry = current;
			this.updateStatusBarText();
		}, this._plugin.settings.activeTimerCheckInterval);
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
					'The Toggl Track API is unreachable. Either the Toggle services are down, or your API token is incorrect.'
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
}
