import type MyPlugin from 'main';
import TimerDescriptionModalContent from './TimerDescriptionModalContent.svelte';
import { Modal } from 'obsidian';

export class TimerDescriptionModal extends Modal {
	private readonly resolve: (value: string) => void;

	// private input: AbstractTextComponent<HTMLInputElement>;
	private readonly content: TimerDescriptionModalContent;

	/**
	 * @param plugin Reference to the plugin
	 * @param resolve Function to call when the user submits their input
	 */
	constructor(plugin: MyPlugin, resolve: (value: string) => void) {
		super(plugin.app);
		this.resolve = resolve;
		this.titleEl.setText('Timer description');
		this.content = new TimerDescriptionModalContent({
			target: this.contentEl,
			props: {
				value: '',
				onSubmit: (input: string) => {
					console.log(input);
					this.resolve(input);
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
