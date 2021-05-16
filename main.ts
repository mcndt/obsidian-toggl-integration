import {
	App,
	ButtonComponent,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TextComponent
} from 'obsidian';
import TogglManager from 'lib/TogglManager';

interface MyPluginSettings {
	apiToken: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	apiToken: null
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	toggl: TogglManager;

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		this.addSettingTab(new TogglSettingsTab(this.app, this));

		// instantiate toggl class
		this.toggl = new TogglManager(this);
		if (this.settings.apiToken != null || this.settings.apiToken != '') {
			this.toggl.setToken(this.settings.apiToken);
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

class TogglSettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', {
			text: 'Toggl Track integration for Obsidian'
		});

		new Setting(containerEl)
			.setName('API Token')
			.setDesc(
				'Enter your Toggl Track API token to use this plugin. ' +
					'You can find yours at https://track.toggl.com/profile.'
			)
			.addText((text) =>
				text
					.setPlaceholder('Your API token')
					.setValue(this.plugin.settings.apiToken || '')
					.onChange(async (value) => {
						console.log('token: ' + value);
						this.plugin.settings.apiToken = value;
						this.plugin.toggl.setToken(value);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Test API connection')
			.setDesc('Test your API token by connecting to Toggl Track.')
			.addButton((button: ButtonComponent) => {
				button.setButtonText('connect');
				button.onClick(() => this.testConnection(button));
				button.setCta();
			});
	}

	async testConnection(button: ButtonComponent) {
		button.setDisabled(true);
		try {
			await this.plugin.toggl.testConnection();
			button.setButtonText('success!');
		} catch {
			button.setButtonText('test failed');
		} finally {
			button.setDisabled(false);
			window.setTimeout(() => {
				button.setButtonText('connect');
			}, 2500);
		}
	}
}

/* class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
} */
