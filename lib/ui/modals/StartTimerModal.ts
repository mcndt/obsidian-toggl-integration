import type {
  EnrichedWithProject,
  SearchTimeEntriesResponseItem,
  TimeEntryStart,
} from "lib/model/Report-v3";
import type MyPlugin from "main";
import { FuzzyMatch, FuzzySuggestModal } from "obsidian";

import StartTimerModalListItem from "./StartTimerModalListItem.svelte";

type TimeEntry = EnrichedWithProject<SearchTimeEntriesResponseItem>;

enum TimerListItemType {
  NEW_TIMER,
  PAST_ENTRY,
}

interface TimerListItem {
  type: TimerListItemType;
  item?: TimeEntry;
  description?: string;
  project?: string;
  color?: string;
}

export default class StartTimerModal extends FuzzySuggestModal<TimerListItem> {
  private readonly resolve: (value: TimeEntryStart) => void;
  private readonly list: TimerListItem[];

  constructor(
    plugin: MyPlugin,
    resolve: (value: TimeEntryStart) => void,
    timeEntries: TimeEntry[],
  ) {
    super(plugin.app);
    this.resolve = resolve;
    this.list = this._generateTimerList(timeEntries != null ? timeEntries : []);
    this.setPlaceholder("Select a timer to start");
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "⏎", purpose: "Select project" },
      { command: "esc", purpose: "cancel" },
    ]);
  }

  getItems(): TimerListItem[] {
    return this.list;
  }

  getItemText(item: TimerListItem): string {
    if (item.type === TimerListItemType.PAST_ENTRY) {
      return `${item.description} (${item.project})`;
    } else if (item.type === TimerListItemType.NEW_TIMER) {
      return `new timer`;
    }
    return ``;
  }

  renderSuggestion(item: FuzzyMatch<TimerListItem>, el: HTMLElement): void {
    new StartTimerModalListItem({
      props: {
        color: item.item.color,
        description: item.item.description,
        project: item.item.project,
      },
      target: el,
    });
  }

  updateSuggestionElForMode(
    item: FuzzyMatch<SearchTimeEntriesResponseItem>,
    el: HTMLElement,
  ) {}

  async onChooseItem(
    item: TimerListItem,
    evt: MouseEvent | KeyboardEvent,
  ): Promise<void> {
    if (item.type === TimerListItemType.NEW_TIMER) {
      this.resolve(null);
    } else if (item.type === TimerListItemType.PAST_ENTRY) {
      this.resolve({
        description: item.item.description,
        project_id: item.item.project_id,
      });
    }
    this.close();
  }

  private _generateTimerList(items: TimeEntry[]): TimerListItem[] {
    // remove repeated entries
    items = uniqueBy(items, (a, b) => {
      const cond1 = a.description === b.description;
      const cond2 = a.project_id === b.project_id;
      return cond1 && cond2;
    });

    // remove the entries without a description
    items = items.filter(
      (item) => item.description != null && item.description != "",
    );

    let list: TimerListItem[] = items.map(
      (item) =>
        ({
          color: item.$project?.color,
          description: item.description,
          item: item,
          project: item.$project?.name || "(No Project)",
          type: TimerListItemType.PAST_ENTRY,
        } as TimerListItem),
    );

    const newTimerItem: TimerListItem = {
      description: "New timer...",
      project: "",
      type: TimerListItemType.NEW_TIMER,
    };

    list = [newTimerItem].concat(list);

    return list;
  }
}

function uniqueBy(array: any, cond: (a: any, b: any) => boolean) {
  return array.filter(
    (e1: any, i: number) => array.findIndex((e2: any) => cond(e1, e2)) === i,
  );
}
