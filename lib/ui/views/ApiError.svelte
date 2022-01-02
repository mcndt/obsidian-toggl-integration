<script lang="ts">
	export let message: string;
</script>

<div class="container p-4">
	<h3>Failed to load Toggl report ☹️</h3>
	<p>The Toggl API returned the following response:</p>
	<p>Error message:</p>
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
