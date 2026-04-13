import type { PluginSettings } from "./PluginSettings";

export const DEFAULT_SETTINGS: PluginSettings = {
  apiToken: null,
  apiBaseUrl: "https://api.track.toggl.com",
  charLimitStatusBar: 40,
  statusBarFormat: "m [minute]",
  statusBarNoEntryMesssage: "-",
  statusBarPrefix: "Timer: ",
  statusBarShowProject: false,
  updateInRealTime: true,
  workspace: { id: "none", name: "None selected" },
};
