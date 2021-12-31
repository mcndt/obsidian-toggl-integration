<script lang="ts">
	import type { ReportListItem } from './types';

	export let name: string;
	export let totalTime: string;
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
			<div>{totalTime}</div>
		</div>
		<div class="group-items">
			{#each data as e}
				<div class="group-item mb-2 is-flex is-justify-content-space-between">
					<div class="is-flex is-align-items-center">
						{#if e.hex}
							<div
								class="project-circle mr-2"
								style="background-color:{e.hex}"
							/>
						{/if}
						{#if e.count}
							<div class="group-item-count mr-2">
								<span>{e.count}</span>
							</div>
						{/if}
						<span>{e.name}</span>
					</div>
					<div class="group-item-time">{e.totalTime}</div>
				</div>
			{/each}
		</div>
	</div>
</main>

<style>
	/* Moved to style.css */
</style>
