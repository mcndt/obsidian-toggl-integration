import { TogglWorkspace } from "../model/TogglWorkspace";

export interface PluginSettings {
	/**
	 * The user's Toggl Track API token.
	 */
	apiToken: string;
	/**
	 * The Toggl workspace to be used for the user's timer.
	 */
	workspace: TogglWorkspace;
	/**
	 * The max. allowed characters in the title of a timer in
	 * the status bar.
	 */
	charLimitStatusBar: number;
	/**
	 * The interval in ms at which the active timer is polled
	 */
	activeTimerCheckInterval: number;
}


