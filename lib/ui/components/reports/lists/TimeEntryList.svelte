<script lang="ts">
	import TimeEntryListGroup from './TimeEntryListGroup.svelte';
	import type { ReportListGroupData } from './types';

	export let data: ReportListGroupData[];
</script>

<main>
	{#each data as a}
		<TimeEntryListGroup {...a} />
	{/each}
</main>

<style>
	/* your styles go here */
</style>
