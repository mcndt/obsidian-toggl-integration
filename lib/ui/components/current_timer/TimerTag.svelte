<script>
	import { setIcon } from 'obsidian';

	import { onMount } from 'svelte';

	export let name;
	let iconElement;

	onMount(() => {
		setIcon(iconElement, 'price-tag-glyph', 12);
	});
</script>

<div class="is-flex is-align-items-center">
	<span
		id="icon"
		class="mr-1 is-flex is-flex-direction-column is-justify-content-center"
		bind:this={iconElement}
	/>
	<span>{name}</span>
</div>

<style>
	span {
		color: var(--text-muted);
		font-size: 0.8em;
	}
</style>
