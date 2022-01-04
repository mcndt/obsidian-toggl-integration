<script lang="ts">
	export let onDismiss: () => void;
</script>

<div class="message px-4 py-4">
	<p>
		New in 0.4.0: Create Toggl reports inside of your notes with code blocks.
		Learn more by reading the
		<a
			href="https://github.com/mcndt/obsidian-toggl-integration/releases/tag/0.4.0"
			>release notes</a
		>.
	</p>
	<footer>
		<button on:click={onDismiss}>Don't show again</button>
	</footer>
</div>

<style>
	.message {
		background-color: var(--background-modifier-border);
		width: 100%;
		font-size: 0.9em;
	}

	.message p {
		margin-top: 0 !important;
	}
</style>
