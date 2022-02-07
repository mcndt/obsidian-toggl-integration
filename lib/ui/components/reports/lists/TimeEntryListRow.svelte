<script lang="ts">
	import type { ReportListItem } from './types';
	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';
	import TimerTag from '../../current_timer/TimerTag.svelte';

	export let data: ReportListItem;
</script>

<div class="group-item mb-2 is-flex is-justify-content-space-between">
	<div
		class="is-flex is-align-items-center group-item-description is-flex-wrap-wrap"
	>
		{#if data.hex}
			<div class="project-circle mr-2" style="background-color:{data.hex}" />
		{/if}
		{#if data.count && data.count != 1}
			<div
				class="group-item-count mr-2 is-flex is-align-items-center is-justify-content-center"
			>
				<span>{data.count}</span>
			</div>
		{/if}
		<span class="mr-2">{data.name}</span>
		{#each data.tags as tag}
			<span class="mr-1"><TimerTag name={tag} /></span>
		{/each}
	</div>
	<div class="group-item-time ml-3">
		{millisecondsToTimeString(data.totalTime)}
	</div>
</div>
