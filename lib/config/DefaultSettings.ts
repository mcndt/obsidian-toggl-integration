import type { PluginSettings } from "./PluginSettings";

export const DEFAULT_SETTINGS: PluginSettings = {
  apiToken: null,
  charLimitStatusBar: 40,
  updateInRealTime: true,
  workspace: { id: "none", name: "None selected" },
};
