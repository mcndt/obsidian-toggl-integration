import type { Project } from "lib/model/Project";
import type TogglService from "lib/toggl/TogglService";
import type MyPlugin from "main";
import { FuzzyMatch, FuzzySuggestModal } from "obsidian";

import SelectProjectModalListItem from "./SelectProjectModalListItem.svelte";

enum ProjectItemType {
  PROJECT,
  NO_PROJECT,
}

interface ProjectItem {
  type: ProjectItemType;
  project?: Project;
  projectName?: string;
  color?: string;
}

export class SelectProjectModal extends FuzzySuggestModal<ProjectItem> {
  private readonly toggl: TogglService;
  private readonly list: ProjectItem[];
  private readonly resolve: (value: Project) => void;

  /**
   * The resolve callback will be called with the selected
   * project as parameter when the user makes input. Value
   * will be null if the user selected 'No Project'.
   */
  constructor(plugin: MyPlugin, resolve: (value: Project) => void) {
    super(plugin.app);
    this.toggl = plugin.toggl;
    this.resolve = resolve;
    this.list = this._generateProjectList(this.toggl.cachedProjects);
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

  private _generateProjectList(items: Project[]): ProjectItem[] {
    items = items.filter((p: Project) => p.active === true);
    const list = items.map(
      (p: Project) =>
        ({
          color: p.hex_color,
          project: p,
          projectName: p.name,
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
