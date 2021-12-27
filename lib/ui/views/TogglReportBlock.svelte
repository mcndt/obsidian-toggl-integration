<script lang="ts">
	import ReportBlockHeader from '../components/report_blocks/ReportBlockHeader.svelte';
	import ReportBlockList from '../components/report_blocks/list/ReportBlockList.svelte';
	import type { ReportListGroupData } from '../components/report_blocks/list/types';
	import BarChart from '../components/report_blocks/summary/BarChart.svelte';

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

<main>
	<ReportBlockHeader totalTime="26:21:04" />
	<!-- <ReportBlockList data={list_by_group} />
	<ReportBlockList data={list_by_date} /> -->

	<BarChart />
</main>

<style>
</style>
