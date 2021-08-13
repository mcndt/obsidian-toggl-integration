<script lang="ts">
	import type Report from 'lib/model/Report';
	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';
	import { dailySummary } from 'lib/util/stores';
	import { onDestroy } from 'svelte';

	let list: { color: string; duration: string; name: string }[];

	const computeList = (r: Report) => {
		if (r == null) {
			return [];
		}
		return r.data.map((d) => ({
			color: d.id != null ? d.title.hex_color : 'var(--text-muted)',
			duration: millisecondsToTimeString(d.time),
			name: d.id != null ? d.title.project : '(No project)'
		}));
	};

	const unsubscribe = dailySummary.subscribe((val) => {
		list = computeList(val);
	});

	onDestroy(unsubscribe);
</script>

<div>
	{#each list as e, i}
		<div class="project-row is-flex is-justify-content-space-between">
			<div class="is-flex is-align-items-center">
				<span class="project-circle" style="background-color: {e.color};" />
				<span class="ml-3 project-row-name" style="color: {e.color};">
					{e.name}
				</span>
			</div>
			<span class="project-row-duration">{e.duration}</span>
		</div>
	{/each}
</div>

<style>
	.project-row {
		font-size: 0.9em;
	}

	.project-row:not(:first-child) {
		margin-top: 0.25em;
	}

	.project-circle {
		width: 0.8em;
		height: 0.8em;
		border-radius: 50%;
	}

	.project-row-duration {
		color: var(--text-muted);
	}
</style>
