<script lang="ts">
	import type { ProjectSummaryItem } from './types';

	export let data: ProjectSummaryItem[];
</script>

<div class="time-entry-list">
	<div
		class="time-entry-group-header is-flex is-justify-content-space-between pb-1 mb-2"
	>
		<div class="is-flex is-align-items-center">
			<span>Project</span>
		</div>
		<div class="is-flex">
			<div class="header-right">Time</div>
			<div class="header-right percent">Percent</div>
		</div>
	</div>
	<div class="group-items">
		{#each data as d}
			<div class="group-item mb-2 is-flex is-justify-content-space-between">
				<div class="is-flex is-align-items-center">
					{#if d.hex}
						<div class="project-circle mr-2" style="background-color:{d.hex}" />
					{/if}
					<span>{d.title}</span>
					{#if d.client_title}
						&nbsp<span class="project-client">• {d.client_title}</span>
					{/if}
				</div>

				<div class="is-flex">
					<div class="group-item-time">{d.totalTime}</div>
					<div class="group-item-time percent">{d.percent.toFixed(1)}%</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.project-client {
		color: var(--text-muted);
		font-weight: 300;
	}

	.group-item-time {
		width: 6rem;
	}

	.header-right {
		width: 6rem;
		text-align: right;
	}

	@media (max-width: 640px) {
		.percent {
			display: none;
		}
	}
</style>
