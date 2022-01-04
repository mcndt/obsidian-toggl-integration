<script lang="ts">
	import type { Detailed, Report, Summary } from 'lib/model/Report';
	import { parse } from 'lib/reports/parser/Parse';
	import { Query, QueryType, SelectionMode } from 'lib/reports/ReportQuery';
	import { togglStore } from 'lib/util/stores';
	import { onMount } from 'svelte';
	import ParsingError from './ParsingError.svelte';
	import ApiError from './ApiError.svelte';
	import TogglSummaryReport from './TogglSummaryReport.svelte';
	import TogglListReport from './TogglListReport.svelte';
	import LoadingAnimation from '../components/LoadingAnimation.svelte';
	import { Keyword, Token } from 'lib/reports/parser/Parser';
	import { tokenize } from 'lib/reports/parser/Tokenize';

	export let source: string;

	let _width: number;
	let _parseError: string;
	let _apiError: string;
	let _query: Query;
	let _summaryReport: Report<Summary>;
	let _detailedReport: Report<Detailed>;
	let _title: string;
	let _reportComponent: any;

	let _ready = false;
	let _error = false;

	$: if (!_ready) {
		if (_query) {
			switch (_query.type) {
				case QueryType.SUMMARY:
					_ready = !!_summaryReport && !!_detailedReport;
					break;
				case QueryType.LIST:
					_ready = !!_detailedReport;
			}
		}
	}

	$: _error = !!_apiError || !!_parseError;

	onMount(async () => {
		try {
			_query = parseQuery(source);
			getDetailedReport(_query)
				.then(
					(report) => (_detailedReport = filterDetailedReport(report, _query))
				)
				.catch((err) => {
					_apiError = err.message;
				});
			if (_query.type === QueryType.SUMMARY) {
				_reportComponent = TogglSummaryReport;
				getSummaryReport(_query)
					.then(
						(report) => (_summaryReport = filterSummaryReport(report, _query))
					)
					.catch((err) => {
						_apiError = err.message;
					});
			} else if (_query.type === QueryType.LIST) {
				_reportComponent = TogglListReport;
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

	function filterDetailedReport(
		report: Report<Detailed>,
		query: Query
	): Report<Detailed> {
		if (query.projectSelection) {
			const include = query.projectSelection.mode === SelectionMode.INCLUDE;
			const list = query.projectSelection.list;

			report.data = report.data.filter((d: Detailed) => {
				const match = list.includes(d.project) || list.includes(d.pid);
				return include ? match : !match;
			});
		}
		return report;
	}

	function filterSummaryReport(
		report: Report<Summary>,
		query: Query
	): Report<Summary> {
		if (query.projectSelection) {
			const include = query.projectSelection.mode === SelectionMode.INCLUDE;
			const list = query.projectSelection.list;

			let selectionTime = 0;

			report.data = report.data.filter((d: Summary) => {
				const match = list.includes(d.title.project) || list.includes(d.id);
				if (match) {
					selectionTime += d.time;
				}
				return include ? match : !match;
			});

			report.total_grand = include
				? selectionTime
				: report.total_grand - selectionTime;
		}
		return report;
	}
</script>

<div class="my-5" bind:clientWidth={_width}>
	{#if _parseError}
		<ParsingError query={source} message={_parseError} />
	{/if}

	{#if _apiError}
		<ApiError message={_apiError} />
	{/if}

	{#if _ready && !_error}
		<svelte:component
			this={_reportComponent}
			title={_title}
			summary={_summaryReport}
			detailed={_detailedReport}
			query={_query}
		/>
	{/if}

	{#if !_ready && !_error}
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
