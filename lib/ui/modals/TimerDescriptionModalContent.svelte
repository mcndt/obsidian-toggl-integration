<script lang="ts">
	import { onMount } from 'svelte';
	import Select from 'svelte-select/src/Select.svelte';

	export let existingTags: string[];
	export let onSubmit: (value: { description: string; tags: string[] }) => void;

	let value = '';
	let selectedTags: string[];

	let tagSelect: HTMLElement;

	onMount(() => {
		const selectContainer = tagSelect.getElementsByClassName('multiSelect')[0];
		const input = selectContainer.getElementsByTagName('input')[0];

		input.onkeydown = (ev: KeyboardEvent) => {
			if (input.value == '') {
				submit(ev);
			}
		};
	});

	const handleSelect = (event: any) => {
		if (event.detail) {
			selectedTags = event.detail.map((o: any) => o.value);
		}
	};

	const handleClear = () => {
		selectedTags = [];
	};

	const submit = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			onSubmit({ description: value, tags: selectedTags });
		}
	};
</script>

<div>
	<input
		bind:value
		on:keydown={submit}
		class="toggl-modal-input"
		type="text"
		placeholder="(No description)"
		style="width: 100%;"
	/>

	<div id="tagSelect" class="mt-4" bind:this={tagSelect}>
		<Select
			items={existingTags}
			on:select={handleSelect}
			on:clear={handleClear}
			isMulti={true}
			placeholder="(No tags)"
			containerClasses="select-container"
			isClearable={false}
			hideEmptyState={false}
			isCreatable={true}
			showIndicator={true}
		/>
	</div>

	<div class="prompt-instructions">
		<div class="prompt-instruction">
			<span class="prompt-instruction-command">⏎</span>
			<span>to start timer</span>
		</div>
		<div class="prompt-instruction">
			<span class="prompt-instruction-command">esc</span>
			<span>cancel</span>
		</div>
	</div>
</div>

<style>
</style>
