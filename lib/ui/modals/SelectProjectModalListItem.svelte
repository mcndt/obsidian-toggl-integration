<script lang="ts">
	export let project = '';
	export let color = 'rgba(0,0,0,0)';
</script>

<div>
	<span class="project-search-color" style="background-color:{color}" />
	<span class="project-search-name">{project}</span>
</div>

<style>
	/* your styles go here */
</style>
