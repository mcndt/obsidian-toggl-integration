<script lang="ts">
	import type { Report, Summary } from 'lib/model/Report';
	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';
	import ReportBlockHeader from '../components/reports/ReportBlockHeader.svelte';

	export let report: Report<Summary>;
</script>

<div>
	Total grand: {report.total_grand}
</div>

<!-- <ReportBlockHeader totalTime={millisecondsToTimeString(report.total_grand)} /> -->
