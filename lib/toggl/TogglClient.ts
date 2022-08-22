import { checkVersion } from 'lib/util/checkVersion';
import { apiVersion } from 'obsidian';
import TogglClient from 'toggl-client';

// http headers used on every call to the Toggl API.
const headers = {
	'user-agent':
		'Toggl Integration for Obsidian (https://github.com/mcndt/obsidian-toggl-integration)'
};

/**
 * Creates a TogglClient instance with the given API token.
 * @param apiToken the Toggl API token to use for the client.
 * @returns a TogglClient instance.
 */
export function createClient(apiToken: string): typeof import('toggl-client') {
	return TogglClient({
		apiToken,
		headers,
		legacy: checkVersion(apiVersion, 0, 13, 25)
	});
}
