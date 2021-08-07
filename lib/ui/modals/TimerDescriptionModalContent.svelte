<script lang="ts">
	export let value = '';
	export let onSubmit: (value: string) => void;

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
