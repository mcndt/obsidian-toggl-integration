import type { PluginSettings } from 'lib/config/PluginSettings';
import type { Project } from 'lib/model/Project';
import type Report from 'lib/model/Report';
import type { Tag } from 'lib/model/Tag';
import type { TimeEntry, TimeEntryStart } from 'lib/model/TimeEntry';
import type { TogglWorkspace } from 'lib/model/TogglWorkspace';
import { settingsStore } from 'lib/util/stores';
import moment from 'moment';
import TogglClient from 'toggl-client';

/** http headers used on every call to the Toggl API. */
const headers = {
	'user-agent':
		'Toggl Integration for Obsidian (https://github.com/mcndt/obsidian-toggl-integration)'
};

/** Wrapper class for performing common operations on the Toggl API. */
export default class ApiManager {
	private _api: any;
	private _settings: PluginSettings;

	constructor() {
		settingsStore.subscribe((val: PluginSettings) => (this._settings = val));
	}

	/** Must be called after constructor and before use of the API. */
	public async initialize(apiToken: string) {
		this._api = TogglClient({ apiToken, headers });
		try {
			await this.testConnection();
		} catch {
			throw 'Cannot connect to Toggl API.';
		}
	}

	/** Throws an Error when the Toggl Track API cannot be reached. */
	public async testConnection() {
		await this._api.workspaces.list();
	}

	/** @returns list of the user's workspaces. */
	public async getWorkspaces(): Promise<TogglWorkspace[]> {
		const response = await this._api.workspaces.list();
		return response.map(
			(w: any) =>
				({ id: (w.id as number).toString(), name: w.name } as TogglWorkspace)
		);
	}

	/**
	 * @returns list of the user's projects for the configured Toggl workspace.
	 * NOTE: this makes an async call to the Toggl API. To get cached projects,
	 * use the computed property cachedProjects instead.
	 */
	public async getProjects(): Promise<Project[]> {
		const response = await this._api.workspaces.projects(
			this._settings.workspace.id
		);
		return response.map(
			(p: any) =>
				({
					name: p.name,
					id: p.id,
					cid: p.cid,
					active: p.active,
					actual_hours: p.actual_hours,
					hex_color: p.hex_color
				} as Project)
		);
	}

	/**
	 * @returns list of the user's tags for the configured Toggl workspace.
	 * NOTE: this makes an async call to the Toggl API. To get cached tags,
	 * use the computed property cachedTags instead.
	 */
	public async getTags(): Promise<Tag[]> {
		const response = await this._api.workspaces.tags(
			this._settings.workspace.id
		);
		return response as Tag[];
	}

	/** @returns list of recent time entries for the user's workspace. */
	public async getRecentTimeEntries(): Promise<TimeEntry[]> {
		const response = await this._api.reports.details(
			this._settings.workspace.id
		);
		console.debug('Toggl API response: recent time entries');
		return response.data.map(
			(e: any) =>
				({
					id: e.id,
					description: e.description,
					duration: e.dur,
					start: e.start,
					end: e.end,
					pid: e.pid,
					project: e.project,
					project_hex_color: e.project_hex_color,
					tags: e.tags
				} as TimeEntry)
		);
	}

	/**
	 * Fetches a report for the current day according to the Toggl Track Report API.
	 * @returns a {@link Report} object containing the report data as defined by
	 * the track report API
	 * (see https://github.com/toggl/toggl_api_docs/blob/master/reports.md).
	 *
	 * NOTE: this method is used to fetch the latest summary at key events. To
	 *       access the latest report, subscribe to the store {@link dailyReport}
	 */
	public async getDailySummary(): Promise<Report> {
		const response: Report = await this._api.reports.summary(
			this._settings.workspace.id,
			{
				since: moment().format('YYYY-MM-DD'),
				order_field: 'duration',
				order_desc: 'on'
			}
		);
		return response;
	}

	/**
	 * Starts a new timer on Toggl Track with the given
	 * description and project.
	 * @param entry the description and project to start a timer on.
	 */
	public async startTimer(entry: TimeEntryStart): Promise<TimeEntry> {
		return this._api.timeEntries.start(entry);
	}

	/** Stops the currently running timer. */
	public async stopTimer(id: number): Promise<TimeEntry> {
		return this._api.timeEntries.stop(id);
	}

	/** Returns the currently running timer, if any. */
	public async getCurrentTimer() {
		return this._api.timeEntries.current();
	}
}
