<script lang="ts">
	import type { Detailed, Report, Summary } from 'lib/model/Report';
	import { parse } from 'lib/reports/parser/Parse';
	import {
		Query,
		QueryType,
		SelectionMode,
		tag
	} from 'lib/reports/ReportQuery';
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

	let _parseError: string;
	let _apiError: string;
	let _query: Query;
	let _detailedReport: Report<Detailed>;
	let _title: string;
	let _reportComponent: any;

	let _ready = false;
	let _error = false;

	$: if (_query && !_ready) {
		_ready = !!_detailedReport;
	}

	$: _error = !!_apiError || !!_parseError;

	onMount(async () => {
		try {
			_query = parseQuery(source);
			getDetailedReport(_query)
				.then(
					(report) =>
						(_detailedReport = filterDetailedReport(report, _query))
				)
				.catch((err) => {
					_apiError = err.message;
				});

			if (_query.type === QueryType.SUMMARY) {
				_reportComponent = TogglSummaryReport;
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
		_title = query.customTitle ? query.customTitle : getTitle(tokens);
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
				return `${tokens[2]} to ${(tokens[4] as string).toLowerCase()}`;
			case Keyword.PAST:
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
		// filter by project
		if (query.projectSelection) {
			const include =
				query.projectSelection.mode === SelectionMode.INCLUDE;
			const list = query.projectSelection.list;
			report.data = report.data.filter((d: Detailed) => {
				const match = list.includes(d.project) || list.includes(d.pid);
				return include ? match : !match;
			});
		}

		// filter by client
		if (query.clientSelection) {
			const include =
				query.clientSelection.mode === SelectionMode.INCLUDE;
			const list = query.clientSelection.list;
			report.data = report.data.filter((d: Detailed) => {
				const match = list.includes(d.client);
				return include ? match : !match;
			});
		}

		// filter by tags
		if (query.includedTags) {
			report.data = report.data.filter((entry: Detailed) => {
				return entry.tags.reduce((prev, curr) => {
					return (
						prev || query.includedTags.includes(curr.toLowerCase())
					);
				}, false);
			});
		}

		if (query.excludedTags) {
			report.data = report.data.filter((entry: Detailed) => {
				return entry.tags.reduce((prev, curr) => {
					return (
						prev && !query.excludedTags.includes(curr.toLowerCase())
					);
				}, true);
			});
		}

		return report;
	}
</script>

<div class="container my-5">
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
	.container {
		white-space: normal;
	}
</style>
