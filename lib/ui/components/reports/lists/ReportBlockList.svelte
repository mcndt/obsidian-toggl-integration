<script lang="ts">
	import ReportListGroup from './ReportListGroup.svelte';
	import type { ReportListGroupData } from './types';

	export let data: ReportListGroupData[];
</script>

<main>
	{#each data as a}
		<ReportListGroup {...a} />
	{/each}
</main>

<style>
	/* your styles go here */
</style>
