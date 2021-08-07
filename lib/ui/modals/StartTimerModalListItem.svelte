<script lang="ts">
	export let description = '';
	export let project = '';
	export let color = 'rgba(0,0,0,0)';
</script>

<div class="timer-search-item">
	<span class="timer-search-description">
		{description}
	</span>
	<span class="timer-search-project">
		{project}
		<span class="timer-search-color" style="background-color:{color}" />
	</span>
</div>

<style>
	/* your styles go here */
</style>
