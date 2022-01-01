<script lang="ts">
	export let query: string;
	export let message: string;
</script>

<div class="container p-4">
	<h3>Failed to parse query ☹️</h3>
	<p>The following query could not be parsed:</p>
	<code>{query}</code>
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
