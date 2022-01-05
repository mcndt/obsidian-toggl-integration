<script lang="ts">
	import { ApiStatus } from 'lib/toggl/TogglManager';
	import { apiStatusStore, togglStore } from 'lib/util/stores';

	export let buttonSize = 36;

	const onClick = () => {
		if ($togglStore != null) {
			$togglStore.commandTimerStop();
		}
	};
</script>

<svg
	on:click={onClick}
	class="timer-stop-button is-clickable"
	width={buttonSize}
	height={buttonSize}
	viewBox="0 0 36 36"
>
	<rect width="36" height="36" fill="var(--button-fill-outer)" rx="18" />
	<rect
		width="14"
		height="14"
		x="11"
		y="11"
		fill="var(--button-fill-inner)"
		rx="1.5"
	/>
</svg>

<style>
	.timer-stop-button {
		--button-fill-outer: var(--interactive-accent);
		--button-fill-inner: var(--interactive-normal);
	}

	.timer-stop-button:hover {
		--button-fill-outer: var(--interactive-accent-hover);
		--button-fill-inner: var(--interactive-hover);
	}
</style>
