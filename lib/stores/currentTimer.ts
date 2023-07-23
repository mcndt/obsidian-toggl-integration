import type {
  EnrichedWithProject,
  EnrichedWithTags,
  TimeEntry,
} from "lib/model/Report-v3";
import { derived, writable } from "svelte/store";

import { Projects } from "./projects";
import { Tags } from "./tags";

const currentTimer = writable<TimeEntry>(null);

export const setCurrentTimer = currentTimer.set;

const enrichedCurrentTimer = derived(
  [currentTimer, Projects, Tags],
  ([$currentTimer, $projects, $tags]): EnrichedWithProject<
    EnrichedWithTags<typeof $currentTimer>,
    typeof $projects[number]
  > => {
    if (!$currentTimer) return null;

    const project = $projects.find(
      (project) => project.id === $currentTimer.project_id,
    );

    const tags = $currentTimer.tag_ids.map((tagId) =>
      $tags.find((tag) => tag.id === tagId),
    );

    return {
      ...$currentTimer,
      $project: project,
      $tags: tags.some((tag) => tag === undefined) ? undefined : tags,
    };
  },
);

export const CurrentTimer = {
  subscribe: enrichedCurrentTimer.subscribe,
};
