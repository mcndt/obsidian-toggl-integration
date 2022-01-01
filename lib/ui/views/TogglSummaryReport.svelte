<script lang="ts">
	import type { Detailed, Report, Summary } from 'lib/model/Report';
	import type { Query } from 'lib/reports/ReportQuery';
	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';
	import moment from 'moment';
	import BarChart from '../components/reports/charts/BarChart.svelte';
	import DonutChart from '../components/reports/charts/DonutChart.svelte';
	import type { ChartData } from '../components/reports/charts/types';
	import ProjectSummaryList from '../components/reports/lists/ProjectSummaryList.svelte';
	import type { ProjectSummaryItem } from '../components/reports/lists/types';
	import ReportBlockHeader from '../components/reports/ReportBlockHeader.svelte';

	const DONUT_WIDTH = 190;

	export let query: Query;
	export let summary: Report<Summary>;
	export let detailed: Report<Detailed>;

	let _width: number;
	let _barData: ChartData[];
	let _pieData: ChartData[];
	let _listData: ProjectSummaryItem[];

	$: _pieData = getPieData(summary);
	$: _barData = getBarData(detailed, query);
	$: _listData = getListData(summary);

	function getPieData(summary: Report<Summary>): ChartData[] {
		return summary.data.map((s: Summary): ChartData => {
			return {
				name: s.title.project,
				value: s.time,
				hex: s.title.hex_color,
				displayValue: `${s.title.project} (${millisecondsToTimeString(s.time)})`
			};
		});
	}

	function getBarData(report: Report<Detailed>, query: Query): ChartData[] {
		const timePerDay: Map<string, number> = new Map();

		let start = moment(query.from);
		let end = moment(query.to).add(1, 'days');
		let current = start;
		while (current.diff(end, 'days') !== 0) {
			timePerDay.set(current.format('YYYY-MM-DD'), 0);
			current = current.add(1, 'days');
		}

		const partialTimes = report.data.map((d: Detailed) => ({
			date: d.start.slice(0, 10),
			time: d.dur
		}));

		for (const d of partialTimes) {
			timePerDay.set(d.date, timePerDay.get(d.date) + d.time);
		}

		let data: { date: string; time: number }[] = [];

		for (const [date, time] of timePerDay) {
			data.push({ date: date, time: time });
		}

		console.log(query);
		console.log(timePerDay);

		return data.map(
			(d): ChartData => ({
				name: moment(d.date).format('ddd DD-M').replace(' ', '\n'),
				value: d.time / 1000 / 60 / 60,
				displayValue: `${moment(d.date).format(
					'll'
				)} (${millisecondsToTimeString(d.time)})`
			})
		);
	}

	function getListData(summary: Report<Summary>): ProjectSummaryItem[] {
		return summary.data
			.map(
				(s: Summary): ProjectSummaryItem => ({
					title: s.title.project,
					hex: s.title.hex_color,
					totalTime: millisecondsToTimeString(s.time),
					percent: (s.time / summary.total_grand) * 100,
					client_title: s.title.client ? s.title.cient : undefined
				})
			)
			.sort((a, b) => Number(a.title > b.title) * 2 - 1);
	}
</script>

<ReportBlockHeader
	title="This month"
	totalTime={millisecondsToTimeString(summary.total_grand)}
/>

<div
	bind:clientWidth={_width}
	class="is-flex is-justify-content-space-between is-align-items-center"
>
	{#if _width && _barData && _pieData}
		<BarChart data={_barData} width={Math.max(0, _width - DONUT_WIDTH)} />
		<DonutChart data={_pieData} width={DONUT_WIDTH} />
	{/if}
</div>

<ProjectSummaryList data={_listData} />
