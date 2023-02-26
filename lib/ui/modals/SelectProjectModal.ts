import type { ProjectsResponseItem } from "lib/model/Report-v3";
import { Projects } from "lib/stores/projects";
import type MyPlugin from "main";
import { FuzzyMatch, FuzzySuggestModal } from "obsidian";
import { get } from "svelte/store";

import SelectProjectModalListItem from "./SelectProjectModalListItem.svelte";

enum ProjectItemType {
  PROJECT,
  NO_PROJECT,
}

type ProjectItem = {
  type: ProjectItemType;
  project?: ProjectsResponseItem;
  projectName?: string;
  color?: string;
};

export class SelectProjectModal extends FuzzySuggestModal<ProjectItem> {
  private readonly list: ProjectItem[];
  private readonly resolve: (value: ProjectsResponseItem) => void;

  /**
   * The resolve callback will be called with the selected
   * project as parameter when the user makes input. Value
   * will be null if the user selected 'No Project'.
   */
  constructor(
    plugin: MyPlugin,
    resolve: (value: ProjectsResponseItem) => void,
  ) {
    super(plugin.app);
    this.resolve = resolve;
    this.list = this._generateProjectList(get(Projects));
    this.setPlaceholder("Select a project");
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "⏎", purpose: "Select project" },
      { command: "esc", purpose: "cancel" },
    ]);
  }

  getItems(): ProjectItem[] {
    return this.list;
  }

  getItemText(item: ProjectItem): string {
    if (item.type === ProjectItemType.PROJECT) {
      return `${item.project.name}`;
    } else if (item.type === ProjectItemType.NO_PROJECT) {
      return `no project`;
    }
    return ``;
  }

  renderSuggestion(item: FuzzyMatch<ProjectItem>, el: HTMLElement): void {
    new SelectProjectModalListItem({
      props: {
        color: item.item.color,
        project: item.item.projectName,
      },
      target: el,
    });
  }

  onChooseItem(item: ProjectItem, evt: MouseEvent | KeyboardEvent): void {
    this.resolve(item.project || null);
    this.close();
  }

  private _generateProjectList(items: ProjectsResponseItem[]): ProjectItem[] {
    items = items.filter((project) => project.active === true);
    const list = items.map(
      (project) =>
        ({
          color: project.color,
          project: project,
          projectName: project.name,
          type: ProjectItemType.PROJECT,
        } as ProjectItem),
    );
    const noProjectItem: ProjectItem = {
      color: "#CECECE",
      projectName: `(No Project)`,
      type: ProjectItemType.NO_PROJECT,
    };
    return [noProjectItem].concat(list);
  }
}
