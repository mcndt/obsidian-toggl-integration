<script lang="ts">
	import { ApiStatus } from 'lib/toggl/TogglManager';

	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';
	import { apiStatusStore, dailySummary } from 'lib/util/stores';
	import CurrentTimer from '../components/CurrentTimerDisplay.svelte';
	import TogglReportBarChart from '../components/TogglReportBarChart.svelte';
	import TogglReportProjectList from '../components/TogglReportProjectList.svelte';
</script>

<div class="container">
	<div class="p-1">
		<div class="timer px-1">
			<CurrentTimer />
		</div>
		<hr class="mt-4" />

		{#if $apiStatusStore === ApiStatus.NO_TOKEN}
			<p class="error-message">
				Please add your Toggl Track API token in the plugin settings.
			</p>
		{/if}

		{#if $apiStatusStore === ApiStatus.UNREACHABLE}
			<p class="error-message">
				The Toggl Track API is unreachable. Either the Toggl services are down,
				or your API token is incorrect.
			</p>
		{/if}

		{#if $dailySummary}
			<div class="px-1">
				<div class="mt-4">
					<div class="is-flex is-justify-content-space-between">
						<span class="report-scope">Today</span>
						<span class="total-duration"
							>{millisecondsToTimeString($dailySummary.total_grand)}</span
						>
					</div>
					<TogglReportBarChart />
				</div>
				<div class="mt-4">
					<TogglReportProjectList />
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		padding: 0px 16px 0px 16px;
	}

	.timer {
		min-height: 3em;
	}

	hr {
		/* margin: 16px 0 24px 0; */
		border-top: 2px solid var(--background-modifier-border);
	}

	.report-scope {
		font-size: 1.5rem;
		font-weight: 600;
	}

	.total-duration {
		font-size: 1.5rem;
		font-weight: 300;
	}

	.error-message {
		color: var(--text-muted);
	}
</style>
