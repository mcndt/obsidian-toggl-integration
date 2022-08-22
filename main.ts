import type { PluginSettings } from 'lib/config/PluginSettings';
import { Plugin, WorkspaceLeaf } from 'obsidian';
import TogglService from 'lib/toggl/TogglService';
import TogglSettingsTab from 'lib/ui/TogglSettingsTab';
import { DEFAULT_SETTINGS } from 'lib/config/DefaultSettings';
import UserInputHelper from 'lib/util/UserInputHelper';
import TogglReportView from 'lib/ui/views/TogglReportView';
import { VIEW_TYPE_REPORT } from 'lib/ui/views/TogglReportView';
import { CODEBLOCK_LANG } from 'lib/constants';
import reportBlockHandler from 'lib/reports/reportBlockHandler';
import { settingsStore, versionLogDismissed } from 'lib/util/stores';

export default class MyPlugin extends Plugin {
	public settings: PluginSettings;
	public toggl: TogglService;
	public input: UserInputHelper;
	public reportView: TogglReportView;

	async onload() {
		console.log(
			`Loading obsidian-toggl-integration ${this.manifest.version}`
		);

		await this.loadSettings();

		this.addSettingTab(new TogglSettingsTab(this.app, this));

		// instantiate toggl class and set the API token if set in settings.
		this.toggl = new TogglService(this);
		if (this.settings.apiToken != null || this.settings.apiToken != '') {
			this.toggl.setToken(this.settings.apiToken);
			this.input = new UserInputHelper(this);
		}

		// Register commands
		// start timer command
		this.addCommand({
			id: 'start-timer',
			name: 'Start Toggl Timer',
			icon: 'clock',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					this.toggl.startTimer();
				} else {
					return true;
				}
			}
		});

		// stop timer command
		this.addCommand({
			id: 'stop-timer',
			name: 'Stop Toggl Timer',
			icon: 'clock',
			checkCallback: (checking: boolean) => {
				if (!checking) {
					this.toggl.stopTimer();
				} else {
					return this.toggl.currentTimeEntry != null;
				}
			}
		});

		// Register the timer report view
		this.registerView(
			VIEW_TYPE_REPORT,
			(leaf: WorkspaceLeaf) =>
				(this.reportView = new TogglReportView(leaf, this))
		);

		// Add the view to the right sidebar
		if (this.app.workspace.layoutReady) {
			this.initLeaf();
		} else {
			this.app.workspace.onLayoutReady(this.initLeaf.bind(this));
		}

		// Enable processing codeblocks for rendering in-note reports
		this.registerCodeBlockProcessor();
	}

	initLeaf(): void {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE_REPORT).length) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: VIEW_TYPE_REPORT
		});
	}

	/**
	 * Registeres the MarkdownPostProcessor for rendering reports from
	 * codeblock queries.
	 */
	registerCodeBlockProcessor() {
		this.registerMarkdownCodeBlockProcessor(
			CODEBLOCK_LANG,
			reportBlockHandler
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
		if (!this.settings.hasDismissedAlert) {
			this.settings.hasDismissedAlert = false;
		}
		settingsStore.set(this.settings);

		versionLogDismissed.set(this.settings.hasDismissedAlert);
		versionLogDismissed.subscribe((bool) => {
			this.settings.hasDismissedAlert = bool;
			this.saveSettings();
		});
	}

	async saveSettings() {
		await this.saveData(this.settings);
		settingsStore.set(this.settings);
	}
}
