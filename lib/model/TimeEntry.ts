/**
 * @deprecated
 */
export interface TimeEntryStart {
  /**
   * The description for the new time entry
   */
  description: string;
  /**
   * The id of the project to start the new time entry on
   */
  project_id: number;
  /**
   * a list of tag names (optional)
   */
  tag_ids?: string[];
}

/**
 * Time entry data from the Toggl Track API.
 */

/**
 * @deprecated
 */
export interface TimeEntry extends TimeEntryStart {
  /**
   * time entry id
   */
  id: number;
  /**
   * duration in milliseconds
   */
  duration: number;
  /**
   * start time in ISO 8601 date and time format
   * (YYYY-MM-DDTHH:MM:SS)
   */
  start: string;
  /**
   * end time in ISO 8601 date and time format
   * (YYYY-MM-DDTHH:MM:SS)
   */
  end: string;
  /**
   * project name
   */
  project?: string;
  /**
   * project color in hex format
   */
  project_hex_color?: string;
  /**
   * Workspace id
   */
  workspace_id: number;
}
