import type { TimeEntryStart } from "lib/model/TimeEntry";
import type MyPlugin from "main";
import { Modal } from "obsidian";

import TimerDescriptionModalContent from "./TimerDescriptionModalContent.svelte";

export class TimerDescriptionModal extends Modal {
  private readonly resolve: (value: TimeEntryStart) => void;

  // private input: AbstractTextComponent<HTMLInputElement>;
  private readonly content: TimerDescriptionModalContent;

  /**
   * @param plugin Reference to the plugin
   * @param resolve Function to call when the user submits their input
   */
  constructor(plugin: MyPlugin, resolve: (value: TimeEntryStart) => void) {
    super(plugin.app);
    this.resolve = resolve;
    this.titleEl.setText("Timer description");
    this.contentEl.style.overflow = "visible";
    this.content = new TimerDescriptionModalContent({
      props: {
        existingTags: plugin.toggl.cachedTags.map((tag) => tag.name),
        onSubmit: (input: { description: string; tags: string[] }) => {
          this.resolve({
            description: input.description,
            pid: null,
            tags: input.tags != null ? input.tags : [],
          });
          this.close();
        },
        value: "",
      },
      target: this.contentEl,
    });
  }

  onOpen() {
    super.onOpen();
    const input: HTMLInputElement =
      document.querySelector(".toggl-modal-input");
    input.focus();
    input.select();
  }
}
