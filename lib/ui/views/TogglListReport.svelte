<script lang="ts">
	import { groups } from 'd3';

	import type { Detailed, Report } from 'lib/model/Report';
	import type { Query } from 'lib/reports/ReportQuery';
	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';
	import moment from 'moment';
	import TimeEntryList from '../components/reports/lists/TimeEntryList.svelte';
	import type {
		ReportListGroupData,
		ReportListItem
	} from '../components/reports/lists/types';
	import ReportBlockHeader from '../components/reports/ReportBlockHeader.svelte';

	export let query: Query;
	export let detailed: Report<Detailed>;

	let _listGroups: ReportListGroupData[] = [];

	$: if (query && detailed) {
		_listGroups = _getListGroups(detailed, query);
	}

	function _getListGroups(
		report: Report<Detailed>,
		query: Query
	): ReportListGroupData[] {
		// For now, just group by date
		const entryMap: Map<string, ReportListGroupData> = new Map();

		// create the empty map
		let start = moment(query.from);
		let end = moment(query.to ? query.to : query.from).add(1, 'days');
		let current = start;
		while (current.diff(end, 'days') !== 0) {
			entryMap.set(current.format('YYYY-MM-DD'), {
				name: current.format('LL'),
				totalTime: 0,
				data: []
			});
			current = current.add(1, 'days');
		}

		// Fill the map
		for (const d of report.data) {
			const groupKey = d.start.slice(0, 10);
			const group = entryMap.get(groupKey);
			group.data.push({
				name: d.description,
				totalTime: d.dur,
				count: 1,
				hex: d.project_hex_color
			});
			group.totalTime += d.dur;
		}

		// Stack duplicated entries
		let returnData = Array.from(entryMap.values());
		returnData = stackGroupItems(returnData);

		return returnData;
	}

	function stackGroupItems(
		groups: ReportListGroupData[]
	): ReportListGroupData[] {
		for (const group of groups) {
			const itemMap: Map<string, ReportListItem> = new Map();
			for (const d of group.data) {
				if (itemMap.has(d.name)) {
					const item = itemMap.get(d.name);
					item.totalTime += d.totalTime;
					item.count += 1;
				} else {
					itemMap.set(d.name, d);
				}
			}
			group.data = Array.from(itemMap.values());
		}
		return groups;
	}
</script>

<!-- <ReportBlockHeader title="list" totalTime="0:00:00" /> -->

<TimeEntryList data={_listGroups} />
