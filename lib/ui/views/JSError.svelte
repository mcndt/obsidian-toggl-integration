<script lang="ts">
	export let message: string;
</script>

<div class="container p-4">
	<h3>Error while rendering report ☹️</h3>
	<p>
		Please report this exception on <a
			href="https://github.com/mcndt/obsidian-toggl-integration/issues"
			>GitHub</a
		>.
	</p>
	<code>{message}</code>
</div>

<style>
	h3 {
		color: var(--text-error);
	}

	.container {
		background-color: var(--background-primary-alt);
	}
</style>
