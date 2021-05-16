import MyPlugin from 'main';
import togglClient from 'toggl-client';

const TIMER_CHECK_INTERVAL = 1000

export default class Toggl {

	plugin: MyPlugin;
	client: any;

	currentTimerInterval: NodeJS.Timeout = null;
	currentTimeEntry: any = null;

	statusBarItem: HTMLElement;

	constructor(plugin: MyPlugin) {
		this.plugin = plugin;
		this.startTimerInterval();
		this.statusBarItem = this.plugin.addStatusBarItem();
		this.updateStatusBarText()
	}

	/**
	 * Creates a new toggl client object using the passed API token.
	 * @param token the API token for the client.
	 */
	async setToken(token: string) {
		this.client = togglClient({ apiToken: token });
		this.startTimerInterval();
	}
	
	private startTimerInterval() {
		clearInterval(this.currentTimerInterval);
		this.currentTimerInterval = setInterval(async () => {
			if (this.client == null) {
				return;
			}
			const current = await this.client.timeEntries.current();
			if (current != null && (this.currentTimeEntry == null || this.currentTimeEntry.id != current.id)) {
				console.info(`New active Toggl timer (id: ${current.id})`)
			} else if (this.currentTimeEntry != null && current == null) {
				console.info('Stopped active Toggl timer.')
			}
			this.currentTimeEntry = current;
			this.updateStatusBarText();
		}, TIMER_CHECK_INTERVAL)
	}

	private updateStatusBarText() {
		let timer_msg = null;
		if (this.currentTimeEntry == null) {
			timer_msg = '-'
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
		const epoch_time = Math.round((new Date()).getTime() / 1000);
		return epoch_time + timeEntry.duration;
	}

}