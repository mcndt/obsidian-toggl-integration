import type { PluginSettings } from 'lib/config/PluginSettings';
import { MarkdownPostProcessorContext, Plugin, WorkspaceLeaf } from 'obsidian';
import TogglManager from 'lib/toggl/TogglManager';
import TogglSettingsTab from 'lib/ui/TogglSettingsTab';
import { DEFAULT_SETTINGS } from 'lib/config/DefaultSettings';
import UserInputHelper from 'lib/util/UserInputHelper';
import TogglReportView from 'lib/ui/views/TogglReportView';
import { VIEW_TYPE_REPORT } from 'lib/ui/views/TogglReportView';
import { CODEBLOCK_LANG } from 'lib/constants';
import reportBlockHandler from 'lib/reports/reportBlockHandler';
import { settingsStore } from 'lib/util/stores';

export default class MyPlugin extends Plugin {
	public settings: PluginSettings;
	public toggl: TogglManager;
	public input: UserInputHelper;
	public reportView: TogglReportView;

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		this.addSettingTab(new TogglSettingsTab(this.app, this));

		// instantiate toggl class and set the API token if set in settings.
		this.toggl = new TogglManager(this);
		if (this.settings.apiToken != null || this.settings.apiToken != '') {
			this.toggl.setToken(this.settings.apiToken);
			this.input = new UserInputHelper(this);
		}

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
		this.registerMarkdownCodeBlockProcessor(CODEBLOCK_LANG, reportBlockHandler);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		settingsStore.set(this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		settingsStore.set(this.settings);
	}
}
