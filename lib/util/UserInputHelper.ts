import { Project } from 'lib/model/Project';
import { SelectProjectModal } from 'lib/ui/modals/SelectProjectModal';
import { TimerDescriptionModal } from 'lib/ui/modals/TimerDescriptionModal';
import MyPlugin from 'main';
import externalizedPromise from './ExternalizedPromise';

export default class UserInputHelper {
	private readonly plugin: MyPlugin;

	constructor(plugin: MyPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Opens the project selection modal.
	 * @returns a promise that returns the user-selected project.
	 * The value will be null when the user selected "no project".
	 */
	public async letUserSelectProject(): Promise<Project> {
		let [promise, resolve, reject] = externalizedPromise<Project>();
		new SelectProjectModal(this.plugin, resolve).open();
		return promise;
	}

	/**
	 * Opens a modal to let the user type a timer description.
	 * @returns The user input.
	 */
	public async letUserEnterTimerDescription(): Promise<string> {
		let [promise, resolve, reject] = externalizedPromise<string>();
		new TimerDescriptionModal(this.plugin, resolve).open();
		return promise;
	}
}
