export type ProjectId = number;
export type UserId = number;
export type TagId = number;
export type ClientId = number;
export type WorkspaceId = number;
export type TimeEntryId = number;
export type RowNumber = number;
export type DateTimeString = string;

export type SearchTimeEntriesResponseItem = {
  user_id: UserId;
  username: string;
  project_id: ProjectId;
  task_id: null;
  description: string;
  tag_ids: string[];
  hourly_rate_in_cents: null;
  /**
   * Contains a single time entry or an array of time entries, if grouped.
   */
  time_entries: [SearchTimeEntry, ...SearchTimeEntry[]];
  row_number: RowNumber;
};

type SearchTimeEntry = {
  at: DateTimeString;
  id: TimeEntryId;
  seconds: number;
  start: DateTimeString;
  stop: DateTimeString;
};

export type TimeEntryStart = {
  description: string;
  project_id: ProjectId;
  tag_ids?: TagId[];
  tags?: string[];
};

export type TimeEntry = TimeEntryStart & {
  at: DateTimeString;
  description: string;
  duration: number;
  id: TimeEntryId;
  project_id: ProjectId | null;
  server_deleted_at: Date | null;
  start: DateTimeString;
  stop: Date | null;
  tag_ids: TagId[] | null;
  tags: string[] | null;
  user_id: UserId;
  workspace_id: WorkspaceId;
};

export type ProjectsSummaryResponseItem = {
  project_id: ProjectId;
  tracked_seconds: number;
  user_id: UserId;
};

export type ClientsResponseItem = {
  id: ClientId;
  wid: WorkspaceId;
  archived: boolean;
  name: string;
  at: DateTimeString;
};

export type ProjectsResponseItem = {
  id: ProjectId;
  workspace_id: WorkspaceId;
  client_id: ClientId | null;
  name: string;
  is_private: boolean;
  active: boolean;
  at: DateTimeString;
  created_at: DateTimeString;
  server_deleted_at: Date | null;
  color: string;
  rate: null;
  rate_last_updated: Date | null;
  recurring: boolean;
  actual_hours: number;
  wid: WorkspaceId;
  cid: ClientId | null;
};

export type TagsResponseItem = {
  id: TagId;
  workspace_id: WorkspaceId;
  name: string;
  at: DateTimeString;
};

export type EnrichedWithProject<
  T extends { project_id: ProjectId },
  Y extends ProjectsResponseItem = ProjectsResponseItem,
> = T & {
  readonly $project?: Y;
};

export type EnrichedWithTags<T extends { tag_ids: TagId[] }> = T & {
  readonly $tags?: TagsResponseItem[];
};

export type EnrichedWithClient<T extends { client_id: ClientId }> = T & {
  readonly $client?: ClientsResponseItem;
};

export type SummaryReportResponse = {
  groups: SummaryReportResponseGroup[];
};

type SummaryReportResponseGroup = {
  id: number | null;
  sub_groups: SummaryReportResponseSubGroup[];
};

type SummaryReportResponseSubGroup = {
  id: null;
  title?: string;
  seconds: number;
};

export type DetailedReportResponseItem = {
  user_id: UserId;
  project_id: ProjectId | null;
  task_id: null;
  description: string;
  tag_ids: TagId[];
  time_entries: DetailedReportTimeEntry[];
  row_number: RowNumber;
};

type DetailedReportTimeEntry = {
  id: TimeEntryId;
  seconds: number;
  start: DateTimeString;
  stop: DateTimeString;
  at: DateTimeString;
};

export type SummaryTimeChart = {
  seconds: number;
  graph: GraphItem[];
  resolution: "day" | "week" | "month";
};

export type GraphItem = {
  seconds: number;
};
