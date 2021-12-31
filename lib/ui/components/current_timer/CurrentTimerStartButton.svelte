<script lang="ts">
	import { ApiStatus } from 'lib/toggl/TogglManager';
	import { apiStatusStore, togglStore } from 'lib/util/stores';

	export let buttonSize = 36;

	const onClick = () => {
		if ($togglStore != null) {
			$togglStore.commandTimerStart();
		}
	};
</script>

<svg
	on:click={onClick}
	class="timer-start-button is-clickable"
	width={buttonSize}
	height={buttonSize}
	viewBox="0 0 36 36"
>
	<g fill="none" fill-rule="evenodd">
		<rect width="36" height="36" fill="var(--button-fill-outer)" rx="18" />
		<path
			fill="var(--button-fill-inner)"
			d="M13 11.994c0-1.101.773-1.553 1.745-.997l10.51 6.005c.964.55.972 1.439 0 1.994l-10.51 6.007c-.964.55-1.745.102-1.745-.997V11.994z"
		/>
	</g>
</svg>

<style>
	.timer-start-button {
		--button-fill-outer: var(--interactive-accent);
		--button-fill-inner: var(--interactive-normal);
	}

	.timer-start-button:hover {
		--button-fill-outer: var(--interactive-accent-hover);
		--button-fill-inner: var(--interactive-hover);
	}
</style>
