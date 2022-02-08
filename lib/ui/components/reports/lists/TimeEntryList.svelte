<script lang="ts">
	import TimeEntryListGroup from './TimeEntryListGroup.svelte';
	import type { ReportListGroupData } from './types';

	export let data: ReportListGroupData[];
</script>

{#each data as a}
	{#if a.data.length > 0}
		<TimeEntryListGroup {...a} />
	{/if}
{/each}
