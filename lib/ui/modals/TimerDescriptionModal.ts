import type MyPlugin from 'main';
import TimerDescriptionModalContent from './TimerDescriptionModalContent.svelte';
import { Modal } from 'obsidian';
import type { TimeEntryStart } from 'lib/model/TimeEntry';

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
		this.titleEl.setText('Timer description');
		this.content = new TimerDescriptionModalContent({
			target: this.contentEl,
			props: {
				value: '',
				existingTags: plugin.toggl.cachedTags.map((tag) => tag.name),
				onSubmit: (input: string) => {
					console.log(input);
					this.resolve({
						description: input,
						pid: null,
						tags: []
					});
					this.close();
				}
			}
		});
	}

	onOpen() {
		super.onOpen();
		const input: HTMLInputElement =
			document.querySelector('.toggl-modal-input');
		input.focus();
		input.select();
	}
}
