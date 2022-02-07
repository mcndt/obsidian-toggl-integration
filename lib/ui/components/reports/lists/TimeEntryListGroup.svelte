<script lang="ts">
	import type { ReportListItem } from './types';
	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';
	import TimeEntryListRow from './TimeEntryListRow.svelte';

	export let name: string;
	export let totalTime: number;
	export let hex: string = undefined;
	export let data: ReportListItem[];
</script>

<main class="mt-5">
	<div class="time-entry-list">
		<div
			class="time-entry-group-header is-flex is-justify-content-space-between pb-1 mb-2"
		>
			<div class="is-flex is-align-items-center">
				{#if hex}
					<div class="project-circle mr-2" style="background-color:{hex}" />
				{/if}
				<span>{name}</span>
			</div>
			<div>{millisecondsToTimeString(totalTime)}</div>
		</div>
		<div class="group-items">
			{#each data as row}
				<TimeEntryListRow data={row} />
			{/each}
		</div>
	</div>
</main>
