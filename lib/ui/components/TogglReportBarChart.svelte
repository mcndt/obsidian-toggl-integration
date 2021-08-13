<script lang="ts">
	import type Report from 'lib/model/Report';
	import { dailySummary } from 'lib/util/stores';
	import { onDestroy } from 'svelte';

	let list: { color: string; percentage: number }[];

	const computeList = (r: Report) => {
		if (r == null) {
			return [];
		}

		const total = r.total_grand;

		let tmp_list = r.data.map((d) => ({
			color: d.id != null ? d.title.hex_color : 'var(--text-muted)',
			// min width = 5% (before rescaling)
			percentage: Math.max((d.time / total) * 100, 5)
		}));

		// Rescale the widths if necessary
		const sum = tmp_list.reduce((a, b) => a + b.percentage, 0);
		if (sum > 100) {
			tmp_list.forEach((e) => (e.percentage = (e.percentage / sum) * 100));
		}

		return tmp_list;
	};

	const unsubscribe = dailySummary.subscribe((val) => {
		list = computeList(val);
	});

	onDestroy(unsubscribe);
</script>

<div>
	<div class="bar-chart mt-4 is-flex">
		{#each list as e}
			<div
				class="bar-chart-element"
				style="background-color: {e.color}; width: {e.percentage}%"
			/>
		{/each}
	</div>
	<div />
</div>

<style>
	.bar-chart {
		height: 20px;
		width: 100%;
	}

	.bar-chart-element {
		height: 100%;
		opacity: 0.7;
	}

	.bar-chart-element:first-child {
		border-radius: 4px 0 0 4px;
	}

	.bar-chart-element:last-child {
		border-radius: 0 4px 4px 0;
	}
</style>
