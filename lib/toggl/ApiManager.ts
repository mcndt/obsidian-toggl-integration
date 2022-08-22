import type { PluginSettings } from 'lib/config/PluginSettings';
import type { Project } from 'lib/model/Project';
import type { Detailed, Report, Summary } from 'lib/model/Report';
import type { Tag } from 'lib/model/Tag';
import type { TimeEntry, TimeEntryStart } from 'lib/model/TimeEntry';
import type { TogglWorkspace } from 'lib/model/TogglWorkspace';
import type { ISODate } from 'lib/reports/ReportQuery';
import { settingsStore } from 'lib/util/stores';
import moment from 'moment';
import TogglClient from 'toggl-client';
import { apiVersion } from 'obsidian';
import { checkVersion } from 'lib/util/checkVersion';

/** http headers used on every call to the Toggl API. */
const headers = {
	'user-agent':
		'Toggl Integration for Obsidian (https://github.com/mcndt/obsidian-toggl-integration)'
};

/** Wrapper class for performing common operations on the Toggl API. */
export default class TogglAPI {
	private _api: typeof import('toggl-client');
	private _settings: PluginSettings;

	constructor() {
		settingsStore.subscribe(
			(val: PluginSettings) => (this._settings = val)
		);
	}

	/**
	 * Must be called after constructor and before use of the API.
	 */
	public async setToken(apiToken: string) {
		this._api = TogglClient({
			apiToken,
			headers,
			legacy: checkVersion(apiVersion, 0, 13, 25)
		});
		try {
			await this.testConnection();
		} catch {
			throw 'Cannot connect to Toggl API.';
		}
	}

	/**
	 * @throws an Error when the Toggl Track API cannot be reached.
	 */
	public async testConnection() {
		await this._api.workspaces.list();
	}

	/** @returns list of the user's workspaces. */
	public async getWorkspaces(): Promise<TogglWorkspace[]> {
		const response = await this._api.workspaces.list();
		return response.map(
			(w: any) =>
				({
					id: (w.id as number).toString(),
					name: w.name
				} as TogglWorkspace)
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

	/**
	 * @returns list of recent time entries for the user's workspace.
	 */
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
	public async getDailySummary(): Promise<Report<Summary>> {
		const response: Report<Summary> = await this._api.reports.summary(
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
	 * Gets a Toggl Summary Report between since and until date.
	 * @param since ISO-formatted date string of the first day of the summary range (inclusive).
	 * @param until ISO-formatted date string of the last day of the summary range (inclusive).
	 * @returns The report.
	 */
	public async getSummary(
		since: ISODate,
		until: ISODate
	): Promise<Report<Summary>> {
		const response: Report<Summary> = await this._api.reports.summary(
			this._settings.workspace.id,
			{
				since: since,
				until: until,
				order_field: 'duration',
				order_desc: 'on'
			}
		);
		return response;
	}

	/**
	 * Gets a Toggl Detailed Report between since and until date.
	 * Makes multiple HTTP requests until all pages of the paginated result are
	 * gathered, then returns the combined report as a single object.
	 * @param since ISO-formatted date string of the first day of the summary range (inclusive).
	 * @param until ISO-formatted date string of the last day of the summary range (inclusive).
	 * @returns The time entries on the specified page.
	 */
	public async getDetailedReport(
		since: ISODate,
		until: ISODate
	): Promise<Report<Detailed>> {
		// Note that pages start at 1 in Toggl Reports v2, not 0.
		const page1 = await this._getDetailedReportPage(since, until, 1);

		if (page1.total_count <= page1.per_page) {
			return page1;
		}

		const nPages = Math.ceil(page1.total_count / page1.per_page);
		let pages: Report<Detailed>[];

		if (nPages <= 8) {
			console.debug(
				`Requesting ${nPages} time entry pages in parallel mode.`
			);
			const promises: Promise<Report<Detailed>>[] = [];
			for (let i = 2; i <= nPages; i++) {
				promises.push(this._getDetailedReportPage(since, until, i));
			}
			pages = await Promise.all(promises);
		} else {
			console.debug(
				`Requesting ${nPages} time entry pages in batch mode.`
			);
			// Stagger requests to avoid HTTP 429 Too Many Requests
			const batchSize = 10;
			const nBatches = Math.ceil(nPages / batchSize);

			pages = [];
			for (let batch = 0; batch < nBatches; batch++) {
				const promises: Promise<Report<Detailed>>[] = [];
				for (
					let i = Math.max(2, batch * batchSize);
					i <= Math.min(nPages, (batch + 1) * batchSize - 1);
					i++
				) {
					promises.push(this._getDetailedReportPage(since, until, i));
					const newPages = await Promise.all(promises);
					pages = pages.concat(newPages);
				}
			}
		}

		const completeReport = pages.reduce((prevPage, currPage) => {
			prevPage.data = prevPage.data.concat(currPage.data);
			return prevPage;
		}, page1);

		// Sometimes the Toggl API returns duplicate entries,
		// need to deduplicate by entry id
		completeReport.data = completeReport.data.filter(
			(el, index, self) =>
				index === self.findIndex((el2) => el2.id === el.id)
		);

		return completeReport;
	}

	/**
	 * Gets a Toggl Detailed Report between since and until date.
	 * @param since ISO-formatted date string of the first day of the summary range (inclusive).
	 * @param until ISO-formatted date string of the last day of the summary range (inclusive).
	 * @param page The page number to fetch. Note that the first page is 1.
	 * @returns The time entries on the specified page.
	 */
	private async _getDetailedReportPage(
		since: ISODate,
		until: ISODate,
		page: number
	): Promise<Report<Detailed>> {
		const response = this._api.reports.details(
			this._settings.workspace.id,
			{
				since: since,
				until: until,
				page: page
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

	/**
	 * Stops the currently running timer.
	 */
	public async stopTimer(id: number): Promise<TimeEntry> {
		return this._api.timeEntries.stop(id);
	}

	/**
	 * Returns the currently running timer, if any.
	 */
	public async getCurrentTimer() {
		return this._api.timeEntries.current();
	}
}
