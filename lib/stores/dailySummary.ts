import type {
  EnrichedWithProject,
  ProjectsSummaryResponseItem,
} from "lib/model/Report-v3";
import { derived, writable } from "svelte/store";

import { Projects } from "./projects";

const summaryItems = writable<ProjectsSummaryResponseItem[]>([]);

export const setDailySummaryItems = summaryItems.set;

export const DailySummary = derived(
  [summaryItems, Projects],
  ([$summaryItems, $projects]) => {
    const summary = {
      projects_breakdown: ($summaryItems ?? []).map(
        (item): EnrichedWithProject<typeof item> => ({
          ...item,
          $project:
            $projects.find((project) => project.id === item.project_id) ?? null,
        }),
      ),
      total_seconds: ($summaryItems ?? []).reduce((a, b) => a + b.tracked_seconds, 0),
    };

    return summary;
  },
);
