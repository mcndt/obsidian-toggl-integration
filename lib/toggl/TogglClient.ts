import { checkVersion } from "lib/util/checkVersion";
import { apiVersion } from "obsidian";
import TogglClient from "toggl-client";

// http headers used on every call to the Toggl API.
const headers = {
  "user-agent":
    "Toggl Integration for Obsidian (https://github.com/mcndt/obsidian-toggl-integration)",
};

/**
 * Creates a TogglClient instance with the given API token.
 * @param apiToken the Toggl API token to use for the client.
 * @returns a TogglClient instance.
 */
export function createClient(
  apiToken: string,
  apiBaseUrl?: string,
): typeof import("toggl-client") {
  const client = TogglClient({
    apiToken,
    headers,
    legacy: checkVersion(apiVersion, 0, 13, 25),
  });

  // The mcndt fork of `toggl-client` (used by this plugin) hardcodes the
  // API base URL in two places:
  //   - `client.gotOptions.prefixUrl` for Track API v9 (read on every
  //     `requestObsidian` / legacy `requestGot` call)
  //   - per-request `prefixUrl` options injected by reports.js for the
  //     Reports API v2/v3
  // If the user configured a custom base, rewrite both so every call
  // (Track API *and* Reports API) is routed through the custom endpoint.
  if (apiBaseUrl && apiBaseUrl.trim() !== "") {
    const trimmed = apiBaseUrl.trim().replace(/\/+$/, "");
    const OFFICIAL = "https://api.track.toggl.com";

    // 1) Track API v9 — overwrite the default prefixUrl. In legacy mode the
    //    already-built `httpClient` must also be refreshed since it captured
    //    the old prefixUrl at construction time.
    if (client.gotOptions) {
      client.gotOptions.prefixUrl = `${trimmed}/api/v9`;
    }
    if (client.httpClient && typeof client.httpClient.extend === "function") {
      client.httpClient = client.httpClient.extend({
        prefixUrl: `${trimmed}/api/v9`,
      });
    }

    // 2) Reports API — wrap `client.request` so any per-call prefixUrl
    //    pointing at the official host gets rewritten to the user's base.
    const originalRequest = client.request.bind(client);
    client.request = async function (path: string, options: any) {
      if (
        options &&
        typeof options.prefixUrl === "string" &&
        options.prefixUrl.startsWith(OFFICIAL)
      ) {
        options = {
          ...options,
          prefixUrl: trimmed + options.prefixUrl.slice(OFFICIAL.length),
        };
      }
      return originalRequest(path, options);
    };
  }

  return client;
}
