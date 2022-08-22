import type { PluginSettings } from 'lib/config/PluginSettings';
import type { Report, Summary } from 'lib/model/Report';
import type { TimeEntry } from 'lib/model/TimeEntry';
import type TogglService from 'lib/toggl/TogglService';
import type { ApiStatus } from 'lib/toggl/TogglService';
import { writable } from 'svelte/store';

/**
 * NOTE: using {@link writable} for all of the stores because
 * I frankly cannot be bothered wiring up the readable stores.
 */

export const settingsStore = writable<PluginSettings>(null);
export const versionLogDismissed = writable<boolean>(false);

export const togglService = writable<TogglService>(null);
export const apiStatusStore = writable<ApiStatus>(null);
export const currentTimer = writable<TimeEntry>(null);
export const dailySummary = writable<Report<Summary>>(null);
