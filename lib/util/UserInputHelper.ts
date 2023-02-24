import type { Project } from "lib/model/Project";
import type { TimeEntry, TimeEntryStart } from "lib/model/TimeEntry";
import { SelectProjectModal } from "lib/ui/modals/SelectProjectModal";
import SelectTimerModal from "lib/ui/modals/StartTimerModal";
import { TimerDescriptionModal } from "lib/ui/modals/TimerDescriptionModal";
import type MyPlugin from "main";

import externalizedPromise from "./ExternalizedPromise";

export default class UserInputHelper {
  private readonly plugin: MyPlugin;

  constructor(plugin: MyPlugin) {
    this.plugin = plugin;
  }

  /**
   *
   * @param timers List of {@link TimeEntry} objects to display in the
   * 				Fuzzy suggest modal
   * @returns Promise which resolves when the user selected a time entry from
   * 					the passed list. Resolves to null value if user selects
   * 					"new timer".
   */
  public async selectTimer(timers: TimeEntry[]): Promise<TimeEntry> {
    const [promise, resolve] = externalizedPromise<TimeEntry>();
    new SelectTimerModal(this.plugin, resolve, timers).open();
    return promise;
  }

  /**
   * Opens the project selection modal.
   * @returns a promise that returns the user-selected project.
   * The value will be null when the user selected "no project".
   */
  public async selectProject(): Promise<Project> {
    const [promise, resolve] = externalizedPromise<Project>();
    new SelectProjectModal(this.plugin, resolve).open();
    return promise;
  }

  /**
   * Opens a modal to let the user type a timer description.
   * @returns The user input.
   */
  public async enterTimerDetails(): Promise<TimeEntryStart> {
    const [promise, resolve] = externalizedPromise<TimeEntryStart>();
    new TimerDescriptionModal(this.plugin, resolve).open();
    return promise;
  }
}
