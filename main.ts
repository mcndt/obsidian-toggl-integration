import { Plugin } from 'obsidian';
import TogglManager from 'lib/toggl/TogglManager';
import TogglSettingsTab from 'lib/ui/TogglSettingsTab';
import { PluginSettings } from 'lib/config/PluginSettings';
import { DEFAULT_SETTINGS } from 'lib/config/DefaultSettings';
import UserInputHelper from 'lib/util/UserInputHelper';

export default class MyPlugin extends Plugin {
	settings: PluginSettings;
	toggl: TogglManager;
	userInputHelper: UserInputHelper;

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		this.addSettingTab(new TogglSettingsTab(this.app, this));

		// instantiate toggl class and set the API token if set in settings.
		this.toggl = new TogglManager(this);
		if (this.settings.apiToken != null || this.settings.apiToken != '') {
			this.toggl.setToken(this.settings.apiToken);
			this.userInputHelper = new UserInputHelper(this);
		}
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
