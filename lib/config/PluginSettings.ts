import type { TogglWorkspace } from "../model/TogglWorkspace";

export interface PluginSettings {
  /**
   * The user's Toggl Track API token.
   */
  apiToken: string;

  /**
   * The Toggl workspace to be used for the user's timer.
   */
  workspace: TogglWorkspace;

  /** Has dismissed the update alert for 0.4.0 */
  hasDismissedAlert?: boolean;
  
  /** Update the day's total time in real-time in the sidebar */
  updateInRealTime?: boolean;

  /**
   * The max. allowed characters in the title of a timer in
   * the status bar.
   */
  charLimitStatusBar: number;

  /**
   * The time format for the status bar.
   */
  statusBarFormat?: string;

  /**
   * The prefix to show before the time entry in the status bar.
   */
  statusBarPrefix?: string;

  /** Whether to show the project in the status bar. */
  statusBarShowProject?: boolean;

  /** Message shown in the status bar when no time entry is running. */
  statusBarNoEntryMesssage?: string;
}
