import { Project } from 'lib/model/Project';
import TogglManager from 'lib/toggl/TogglManager';
import MyPlugin from 'main';
import { FuzzyMatch, FuzzySuggestModal } from 'obsidian';

enum ProjectItemType {
	PROJECT,
	NO_PROJECT
}

interface ProjectItem {
	type: ProjectItemType;
	project?: Project;
	textLeft?: string;
	itemColor?: string;
}

export class SelectProjectModal extends FuzzySuggestModal<ProjectItem> {
	private readonly toggl: TogglManager;
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
		this.setPlaceholder('Select a project');
		this.setInstructions([
			{ command: '↑↓', purpose: 'to navigate' },
			{ command: '⏎', purpose: 'Select project' },
			{ command: 'esc', purpose: 'cancel' }
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
		super.renderSuggestion(item, el);
		el.innerHTML =
			`<div class="">` +
			`<span class="project-search-color" style="background-color:${
				item.item.itemColor || 'rgba(0,0,0,0)'
			}"></span>` +
			`<span class="project-search-name">` +
			`${item.item.textLeft}` +
			`</span>` +
			`</div>`;
	}

	onChooseItem(item: ProjectItem, evt: MouseEvent | KeyboardEvent): void {
		this.resolve(item.project || null);
		this.close();
	}

	private _generateProjectList(items: Project[]): ProjectItem[] {
		items = items.filter((p: Project) => p.active === true);
		let list = items.map(
			(p: Project) =>
				({
					type: ProjectItemType.PROJECT,
					project: p,
					textLeft: p.name,
					itemColor: p.hex_color
				} as ProjectItem)
		);
		const noProjectItem: ProjectItem = {
			type: ProjectItemType.NO_PROJECT,
			textLeft: `(No Project)`,
			itemColor: '#CECECE'
		};
		return [noProjectItem].concat(list);
	}
}
