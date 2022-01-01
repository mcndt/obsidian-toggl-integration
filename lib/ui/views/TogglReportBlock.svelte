<script lang="ts">
	import type { Detailed, Report, Summary } from 'lib/model/Report';
	import { parse } from 'lib/reports/parser/Parse';
	import {
		Keyword,
		Keyword,
		Token,
		tokenize
	} from 'lib/reports/parser/Tokenize';
	import { Query, QueryType } from 'lib/reports/ReportQuery';
	import { togglStore } from 'lib/util/stores';
	import { onMount } from 'svelte';
	import ParsingError from './ParsingError.svelte';
	import TogglSummaryReport from './TogglSummaryReport.svelte';
	import TogglListReport from './TogglListReport.svelte';
	import LoadingAnimation from '../components/LoadingAnimation.svelte';

	const DONUT_WIDTH = 190;

	export let source: string;

	let _width: number;
	let _parseError: string;
	let _query: Query;
	let _summaryReport: Report<Summary>;
	let _detailedReport: Report<Detailed>;
	let _title: string;
	let _reportComponent: any;

	onMount(async () => {
		try {
			_query = parseQuery(source);
			getDetailedReport(_query).then((report) => (_detailedReport = report));
			if (_query.type === QueryType.SUMMARY) {
				getSummaryReport(_query).then((report) => (_summaryReport = report));
				_reportComponent = TogglSummaryReport;
			}
		} catch (err) {
			_parseError = err.message;
		}
	});

	function parseQuery(source: string): Query {
		const tokens = tokenize(source);
		const query: Query = parse(source);
		_title = getTitle(tokens);
		return query;
	}

	function getTitle(tokens: Token[]): string {
		switch (tokens[1]) {
			case Keyword.TODAY:
				return 'Today';
			case Keyword.WEEK:
				return 'This week';
			case Keyword.MONTH:
				return 'This month';
			case Keyword.FROM:
				return `${tokens[2]} to ${tokens[4]}`;
			case Keyword.PREVIOUS:
				return `Past ${tokens[2]} ${(<string>tokens[3]).toLowerCase()}`;
			default:
				return 'Untitled Toggl Report';
		}
	}

	async function getDetailedReport(query: Query): Promise<Report<Detailed>> {
		return $togglStore.GetDetailedReport(query);
	}

	async function getSummaryReport(query: Query): Promise<Report<Summary>> {
		return $togglStore.getSummaryReport(query);
	}
</script>

<div class="my-5" bind:clientWidth={_width}>
	{#if _parseError}
		<ParsingError query={source} message={_parseError} />
	{/if}

	{#if _summaryReport && _detailedReport}
		<svelte:component
			this={_reportComponent}
			title={_title}
			summary={_summaryReport}
			detailed={_detailedReport}
			query={_query}
		/>
	{/if}

	{#if !(_summaryReport && _detailedReport) && !_parseError}
		<div style="text-align: center">
			<LoadingAnimation color="var(--interactive-accent)" />
			<p class="mt-0" style="color: var(--text-muted)">
				Loading Toggl report...
			</p>
		</div>
	{/if}
</div>

<style>
</style>
