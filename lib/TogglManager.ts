import MyPlugin from 'main';
import togglClient from 'toggl-client';

const TIMER_CHECK_INTERVAL = 1000;

export default class TogglManager {
	plugin: MyPlugin;
	api: any;

	currentTimerInterval: number = null;
	currentTimeEntry: any = null;

	statusBarItem: HTMLElement;

	constructor(plugin: MyPlugin) {
		this.plugin = plugin;
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.updateStatusBarText();
	}

	/**
	 * Creates a new toggl client object using the passed API token.
	 * @param token the API token for the client.
	 */
	async setToken(token: string) {
		window.clearInterval(this.currentTimerInterval);
		this.api = togglClient({ apiToken: token });
		try {
			await this.testConnection();
			this.startTimerInterval();
		} catch {
			this.statusBarItem.setText('Cannot connect to Toggl API');
		}
	}

	/**
	 * Start polling the Toggl Track API periodically to get the
	 * currently running timer.
	 */
	private startTimerInterval() {
		this.currentTimerInterval = window.setInterval(async () => {
			if (this.api == null) {
				return;
			}
			const current = await this.api.timeEntries.current();
			if (
				current != null &&
				(this.currentTimeEntry == null ||
					this.currentTimeEntry.id != current.id)
			) {
				console.info(`New active Toggl timer (id: ${current.id})`);
			} else if (this.currentTimeEntry != null && current == null) {
				console.info('Stopped active Toggl timer.');
			}
			this.currentTimeEntry = current;
			this.updateStatusBarText();
		}, TIMER_CHECK_INTERVAL);
		this.plugin.registerInterval(this.currentTimerInterval);
	}

	/**
	 * Updates the status bar text to reflect the current Toggl
	 * state (e.g. details of current timer).
	 */
	private updateStatusBarText() {
		let timer_msg = null;
		if (this.currentTimeEntry == null) {
			timer_msg = '-';
		} else {
			const title = this.currentTimeEntry.description;
			const duration = this.getTimerDuration(this.currentTimeEntry);
			const minutes = Math.floor(duration / 60);
			const time_string = `${minutes} minute${minutes != 1 ? 's' : ''}`;
			timer_msg = `${title} (${time_string})`;
		}
		this.statusBarItem.setText(`Timer: ${timer_msg}`);
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

	/**
	 * Throws an Error when the Toggl Track API cannot be reached.
	 */
	public async testConnection() {
		// test by just making a small request to the API.
		// The method will throw an Error when we get a negative
		// response code.
		await this.api.workspaces.list();
	}
}
