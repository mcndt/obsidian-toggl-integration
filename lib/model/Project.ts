export interface Project {
	/**
	 * The name of the project
	 */
	name: string;

	/**
	 * Project ID in Toggl API
	 */
	id: number;

	/**
	 * Client ID for the project
	 */
	cid: string;

	/**
	 * is the project marked as active
	 */
	active: boolean;

	/**
	 * hours spent on project
	 */
	actual_hours: number;

	/**
	 * color of project in Toggl UI
	 */
	hex_color: string;
}
