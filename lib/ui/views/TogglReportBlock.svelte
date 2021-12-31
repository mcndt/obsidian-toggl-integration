<script lang="ts">
	import type { ReportListGroupData } from '../components/reports/lists/types';
	import type { ChartData } from '../components/reports/charts/types';

	import ReportBlockHeader from '../components/reports/ReportBlockHeader.svelte';
	import BarChart from '../components/reports/charts/BarChart.svelte';
	import DonutChart from '../components/reports/charts/DonutChart.svelte';
	import ReportBlockList from '../components/reports/lists/ReportBlockList.svelte';

	const DONUT_WIDTH = 190;

	let _width: number;

	const bar_data: ChartData[] = [
		{
			name: 'Mon\n20-12',
			value: 9.2,
			displayValue: 'placeholder'
		},
		{
			name: 'Tue\n21-12',
			value: 7.1,
			displayValue: 'placeholder'
		},
		{
			name: 'Wed\n22-12',
			value: 6.0,
			displayValue: 'placeholder'
		},
		{
			name: 'Thu\n23-12',
			value: 8.0,
			displayValue: 'placeholder'
		},
		{
			name: 'Fri\n24-12',
			value: 4.25,
			displayValue: 'placeholder'
		},
		{
			name: 'Sat\n25-12',
			value: 4.9,
			displayValue: 'placeholder'
		},
		{
			name: 'Sun\n26-12',
			value: 5.7,
			displayValue: 'placeholder'
		}
	];

	const pie_data: ChartData[] = [
		{
			name: 'Programming',
			value: 9.2,
			hex: '#9E5BD9',
			displayValue: 'placeholder'
		},
		{
			name: 'Reading',
			value: 4.1,
			hex: '#06A893',
			displayValue: 'placeholder'
		},
		{
			name: 'Writing',
			value: 2.0,
			hex: '#E36A00',
			displayValue: 'placeholder'
		},
		{
			name: 'Commuting',
			value: 1.3,
			hex: '#0B83D9',
			displayValue: 'placeholder'
		}
	];

	const list_by_group: ReportListGroupData[] = [
		{
			name: 'Programming',
			hex: '#9E5BD9',
			totalTime: '9:41:00',
			data: [
				{
					name: 'Design report block in figma',
					totalTime: '3:40:54'
				},
				{
					name: '1q84 (Murakami, 2009)',
					totalTime: '6:13:01'
				},
				{
					name: 'Capital and Ideology (Piketty, 2019)',
					totalTime: '4:25:33',
					count: 2
				},
				{
					name: 'Write book review Gates2021',
					totalTime: '1:20:23',
					count: 13
				}
			]
		}
	];

	const list_by_date: ReportListGroupData[] = [
		{
			name: 'Tuesday, December 13',
			hex: '#9E5BD9',
			totalTime: '6:01:45',
			data: [
				{
					name: 'Design report block in figma',
					totalTime: '3:40:54',
					hex: '#9E5BD9',
					count: 3
				},
				{
					name: '1q84 (Murakami, 2009)',
					totalTime: '6:13:01',
					hex: '#06A893'
				},
				{
					name: 'Capital and Ideology (Piketty, 2019)',
					totalTime: '4:25:33',
					hex: '#06A893'
				},
				{
					name: 'Write book review Gates2021',
					totalTime: '1:20:23',
					hex: '#E36A00'
				}
			]
		}
	];
</script>

<main bind:clientWidth={_width}>
	<ReportBlockHeader totalTime="26:21:04" />
	<div class="is-flex is-justify-content-space-between is-align-items-center">
		{#if _width}
			<BarChart data={bar_data} width={Math.max(0, _width - DONUT_WIDTH)} />
			<DonutChart data={pie_data} width={DONUT_WIDTH} />
		{/if}
	</div>

	<ReportBlockList data={list_by_group} />
</main>

<style>
</style>
