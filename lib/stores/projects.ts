import type {
  EnrichedWithClient,
  ProjectsResponseItem,
} from "lib/model/Report-v3";
import { derived, get, writable } from "svelte/store";

import { Clients } from "./clients";

const projects = writable<ProjectsResponseItem[]>([]);

const enrichedProjects = derived(
  [projects, Clients],
  ([$projects, $clients]): EnrichedWithClient<typeof $projects[number]>[] => {
    return $projects.map((project) => ({
      ...project,
      $client: $clients.find((client) => client.id === project.cid),
    }));
  },
);

export const setProjects = projects.set;

export const Projects = { subscribe: enrichedProjects.subscribe };

export function getProjectIds(items: (string | number)[]): number[] {
  const projects = get(Projects);

  return items
    .map((item) => {
      if (typeof item === "number") {
        return item;
      }
      const project = projects.find(
        (project) => project.name.toLowerCase() === item.toLowerCase(),
      );
      return project.id ?? null;
    })
    .filter((id) => id !== null) as number[];
}

export function enrichObjectWithProject<
  T extends Record<string, any>,
  Key extends keyof T = "project_id",
>(object: T, key: Key = "project_id" as Key) {
  const projects = get(Projects);

  return {
    ...object,
    $project: projects.find((project) => project.id === object[key]),
  };
}
