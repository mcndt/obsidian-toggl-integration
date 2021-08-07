import MyPlugin from 'main';
import { AbstractTextComponent, Modal, TextComponent } from 'obsidian';

export class TimerDescriptionModal extends Modal {
	private readonly resolve: (value: string) => void;

	private input: AbstractTextComponent<HTMLInputElement>;

	/**
	 * @param plugin Reference to the plugin
	 * @param resolve Function to call when the user submits their input
	 */
	constructor(plugin: MyPlugin, resolve: (value: string) => void) {
		super(plugin.app);
		this.resolve = resolve;
		this.setModalContent();
	}

	setModalContent() {
		// TODO: do all this stuff in Svelte instead of pure JS
		// add input field
		this.titleEl.setText('Timer description');
		this.input = new TextComponent(this.contentEl);
		this.input.setPlaceholder('(No description)');
		this.input.inputEl.setAttr('style', 'width: 100%');

		// add instructions
		let instructions = this.input.inputEl.appendChild(
			document.createElement('p')
		);
		instructions.innerHTML =
			`<div class='prompt-instruction'>` +
			`<span class='prompt-instruction-command'>⏎</span>` +
			`<span>to start timer<span>` +
			`</div>` +
			`<span class='prompt-instruction-command'>esc</span>` +
			`<span>cancel<span>` +
			`<div class='prompt-instruction'>` +
			`</div>`;
		instructions.classList.add('prompt-instructions');
		this.contentEl.appendChild(instructions);
	}

	onOpen() {
		super.onOpen();
		this.input.inputEl.focus();
		this.input.inputEl.select();
		this.input.inputEl.onkeydown = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				this.resolve(this.input.getValue());
				this.close();
			}
		};
	}
}
