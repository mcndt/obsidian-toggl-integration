<script lang="ts">
	import AutoComplete from 'simple-svelte-autocomplete';
	import { onMount } from 'svelte';

	export let value = '';
	export let existingTags: string[];
	export let selectedTags: string[];
	export let onSubmit: (value: string) => void;

	onMount(() => {
		console.log(existingTags);
	});

	const submit = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			onSubmit(value);
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

	<p>
		Selected tags: {selectedTags}
	</p>

	<AutoComplete
		multiple="true"
		items={existingTags}
		bind:selectedItem={selectedTags}
		hideArrow={true}
		placeholder="(No tags)"
		className="autocomplete"
	/>

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
	.autocomplete {
		background-color: red;
	}
</style>
