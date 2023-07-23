import type { PluginSettings } from "lib/config/PluginSettings";
import type {
  SearchTimeEntriesResponseItem,
  TimeEntryStart,
  TimeEntry,
  ProjectsSummaryResponseItem,
  ProjectsResponseItem,
  TagsResponseItem,
  SummaryReportResponse,
  DetailedReportResponseItem,
  ClientsResponseItem,
  ProjectId,
  TagId,
  ClientId,
  SummaryTimeChart,
} from "lib/model/Report-v3";
import type { TogglWorkspace } from "lib/model/TogglWorkspace";
import type { ISODate } from "lib/reports/ReportQuery";
import { settingsStore } from "lib/util/stores";
import moment from "moment";
import { Notice } from "obsidian";

import { ApiQueue } from "./ApiQueue";
import { createClient } from "./TogglClient";

type ReportOptions = {
  start_date: ISODate;
  end_date: ISODate;
  project_ids?: ProjectId[];
  tag_ids?: TagId[];
  client_ids?: ClientId[];
};

/** Wrapper class for performing common operations on the Toggl API. */
export default class TogglAPI {
  private _api: typeof import("toggl-client");
  private _settings: PluginSettings;
  private _queue = new ApiQueue();

  constructor() {
    settingsStore.subscribe((val: PluginSettings) => (this._settings = val));
  }

  /**
   * Must be called after constructor and before use of the API.
   */
  public async setToken(apiToken: string) {
    this._api = createClient(apiToken);
    try {
      await this.testConnection();
    } catch {
      throw "Cannot connect to Toggl API.";
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
    const response = await this._api.workspaces.list().catch(handleError);

    return response.map(
      (w: any) =>
        ({
          id: (w.id as number).toString(),
          name: w.name,
        } as TogglWorkspace),
    );
  }

  /** @returns list of the user's clients. */
  public async getClients(): Promise<ClientsResponseItem[]> {
    const clients = (await this._api.workspaces
      .clients(this._settings.workspace.id)
      .catch(handleError)) as ClientsResponseItem[];

    return clients;
  }

  /**
   * @returns list of the user's projects for the configured Toggl workspace.
   * NOTE: this makes an async call to the Toggl API. To get cached projects,
   * use the computed property cachedProjects instead.
   */
  public async getProjects(): Promise<ProjectsResponseItem[]> {
    const projects = (await this._api.workspaces
      .projects(this._settings.workspace.id)
      .catch(handleError)) as ProjectsResponseItem[];

    return projects.filter((p) => p.active);
  }

  /**
   * @returns list of the user's tags for the configured Toggl workspace.
   * NOTE: this makes an async call to the Toggl API. To get cached tags,
   * use the computed property cachedTags instead.
   */
  public async getTags(): Promise<TagsResponseItem[]> {
    const tags = (await this._api.workspaces
      .tags(this._settings.workspace.id)
      .catch(handleError)) as TagsResponseItem[];

    return tags;
  }

  /**
   * @returns list of recent time entries for the user's workspace.
   */
  public async getRecentTimeEntries(): Promise<
    SearchTimeEntriesResponseItem[]
  > {
    const response: SearchTimeEntriesResponseItem[] = await this._api.reports
      .details(this._settings.workspace.id, {
        end_date: moment().format("YYYY-MM-DD"),
        order_by: "date",
        order_dir: "desc",
        start_date: moment().subtract(9, "day").format("YYYY-MM-DD"),
      })
      .catch(handleError);

    return response.filter(
      (item) =>
        Array.isArray(item.time_entries) && item.time_entries.length > 0,
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
  public async getDailySummary(): Promise<ProjectsSummaryResponseItem[]> {
    const response: ProjectsSummaryResponseItem[] = await this._api.reports
      .projectsSummary(this._settings.workspace.id, {
        start_date: moment().format("YYYY-MM-DD"),
      })
      .catch(handleError);

    return response;
  }

  /**
   * Gets a Toggl Summary Report between start_date and end_date date.
   * @param start_date ISO-formatted date string of the first day of the summary range (inclusive).
   * @param end_date ISO-formatted date string of the last day of the summary range (inclusive).
   * @returns The report.
   */
  public async getSummary(options: ReportOptions) {
    const response = (await this._api.reports.summary(
      this._settings.workspace.id,
      {
        ...options,
        collapse: true,
        grouping: "projects",
        sub_grouping: "time_entries",
        // order_field: 'duration',
        // order_desc: 'on'
      },
    )) as SummaryReportResponse;

    return response;
  }

  public async getSummaryTimeChart(options: ReportOptions) {
    const response = (await this._api.reports.totals(
      this._settings.workspace.id,
      {
        ...options,
        collapse: true,
        grouping: "projects",
        with_graph: true,
      },
    )) as SummaryTimeChart;

    return response;
  }

  /**
   * Gets a Toggl Detailed Report between start_date and end_date date.
   * Makes multiple HTTP requests until all pages of the paginated result are
   * gathered, then returns the combined report as a single object.
   * @param start_date ISO-formatted date string of the first day of the summary range (inclusive).
   * @param end_date ISO-formatted date string of the last day of the summary range (inclusive).
   * @returns The time entries on the specified page.
   */
  public async getDetailedReport(
    options: ReportOptions,
  ): Promise<DetailedReportResponseItem[]> {
    const response = await this._queue.queue<DetailedReportResponseItem[]>(() =>
      this._api.reports.detailsAll(this._settings.workspace.id, {
        ...options,
        grouped: true, // grouping means less pages, so less requests and faster results.
      }),
    );
    return response;
  }

  /**
   * Starts a new timer on Toggl Track with the given
   * description and project.
   * @param entry the description and project to start a timer on.
   */
  public async startTimer(entry: TimeEntryStart): Promise<TimeEntry> {
    return this._api.timeEntries
      .start({
        ...entry,
        created_with: "Toggl Track for Obsidian",
        // https://developers.track.toggl.com/docs/tracking/index.html#:~:text=for%20example%20120.-,To%20create%20a%20time%20entry,-that%20started%20and
        // "To create a time entry that started and continues to be running, the
        // duration field is the negative UNIX timestamp for when it started."
        duration: -moment().unix(),
        start: moment().format(),
        stop: null,
        workspace_id: parseInt(this._settings.workspace.id),
      })
      .catch(handleError);
  }

  /**
   * Stops the currently running timer.
   */
  public async stopTimer(entry: TimeEntry): Promise<TimeEntry> {
    return this._api.timeEntries.stop(entry).catch(handleError);
  }

  /**
   * Returns the currently running timer, if any.
   */
  public async getCurrentTimer(): Promise<TimeEntry> {
    return this._api.timeEntries.current();
  }
}

const handleError = (error: unknown) => {
  console.error("Toggl API error: ", error);
  new Notice("Error communicating with Toggl API: " + error);
};
