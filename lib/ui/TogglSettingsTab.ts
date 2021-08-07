import type MyPlugin from 'main';
import type { TogglWorkspace } from '../model/TogglWorkspace';
import { DEFAULT_SETTINGS } from '../config/DefaultSettings';
import {
	App,
	ButtonComponent,
	DropdownComponent,
	ExtraButtonComponent,
	PluginSettingTab,
	Setting
} from 'obsidian';

export default class TogglSettingsTab extends PluginSettingTab {
	private plugin: MyPlugin;
	private workspaceDropdown: DropdownComponent;
	private workspaces: TogglWorkspace[];

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

		this.addApiTokenSetting(containerEl);
		this.addTestConnectionSetting(containerEl);
		this.addWorkspaceSetting(containerEl);
	}

	private addApiTokenSetting(containerEl: HTMLElement) {
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
						this.plugin.settings.apiToken = value;
						this.plugin.toggl.setToken(value);
						await this.plugin.saveSettings();
					})
			);
	}

	private addTestConnectionSetting(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName('Test API connection')
			.setDesc('Test your API token by connecting to Toggl Track.')
			.addButton((button: ButtonComponent) => {
				button.setButtonText('connect');
				button.onClick(() => this.testConnection(button));
				button.setCta();
			});
	}

	private addWorkspaceSetting(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName('Toggl Workspace')
			.setDesc('Select your Toggl Workspace for fetching past timer entries.')
			.addExtraButton((button: ExtraButtonComponent) => {
				button.setIcon('reset').setTooltip('Fetch Workspaces');
				button.extraSettingsEl.addClass('extra-button');
				button.onClick(async () => {
					await this.fetchWorkspaces();
				});
			})
			.addDropdown(async (dropdown: DropdownComponent) => {
				// Register callback for saving new value
				dropdown.onChange(async (value: string) => {
					const workspace = this.workspaces.find((w) => w.id === value);
					this.plugin.settings.workspace = workspace;
					await this.plugin.saveSettings();
				});
				this.workspaceDropdown = dropdown;
				await this.fetchWorkspaces();
			});
	}

	private async fetchWorkspaces() {
		// empty the dropdown's list
		const selectEl = this.workspaceDropdown.selectEl;
		for (let i = selectEl.length - 1; i >= 0; i--) {
			this.workspaceDropdown.selectEl.remove(i);
		}

		// add the current setting to populate the field
		const currentWorkspace = this.plugin.settings.workspace;
		this.workspaceDropdown.addOption(
			currentWorkspace.id,
			currentWorkspace.name
		);
		this.workspaceDropdown.setValue(currentWorkspace.id);

		// fetch the other workspaces from the Toggl API
		if (this.plugin.toggl.isApiAvailable) {
			this.workspaces = await this.plugin.toggl.getWorkspaces();
			this.workspaces = this.workspaces.filter(
				(w) => w.id != currentWorkspace.id
			);
			for (const w of this.workspaces) {
				this.workspaceDropdown.addOption(w.id, w.name);
			}
		}
	}

	private async testConnection(button: ButtonComponent) {
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
