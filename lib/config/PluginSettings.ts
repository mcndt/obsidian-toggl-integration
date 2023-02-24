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

  /**
   * The max. allowed characters in the title of a timer in
   * the status bar.
   */
  charLimitStatusBar: number;

  /** Has dismissed the update alert for 0.4.0 */
  hasDismissedAlert?: boolean;

  /** Update the day's total time in real-time in the sidebar */
  updateInRealTime?: boolean;
}
