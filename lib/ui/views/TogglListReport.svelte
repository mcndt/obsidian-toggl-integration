<script lang="ts">
	import { groups } from 'd3';

	import type { Detailed, Report } from 'lib/model/Report';
	import { GroupBy, Query, SortOrder } from 'lib/reports/ReportQuery';
	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';
	import moment from 'moment';
	import TimeEntryList from '../components/reports/lists/TimeEntryList.svelte';
	import type {
		ReportListGroupData,
		ReportListItem
	} from '../components/reports/lists/types';

	export let query: Query;
	export let detailed: Report<Detailed>;

	let _listGroups: ReportListGroupData[] = [];

	$: if (query && detailed) {
		_listGroups = getListGroups(detailed, query);
	}

	function getListGroups(
		report: Report<Detailed>,
		query: Query
	): ReportListGroupData[] {
		// Group entries by date or project
		report = sanitizeData(report);
		let returnData: ReportListGroupData[];
		if (query.groupBy) {
			if (query.groupBy === GroupBy.PROJECT) {
				returnData = groupByAttribute(
					report,
					query,
					'project',
					false,
					'project_hex_color'
				);
			} else if (query.groupBy === GroupBy.CLIENT) {
				returnData = groupByAttribute(report, query, 'client', true);
			}
		} else {
			returnData = groupByDate(report, query);
		}

		// Stack duplicated entries
		returnData = stackGroupItems(returnData);

		// Sort, if requested
		if (query.sort) {
			if (query.groupBy && query.groupBy !== GroupBy.DATE) {
				sortNamedGroups(returnData, query.sort);
			} else {
				sortDateGroups(returnData, query.sort);
			}
		}

		return returnData;
	}

	function sanitizeData(report: Report<Detailed>): Report<Detailed> {
		for (const d of report.data) {
			// sanitize Markdown links
			const match = d.description.match(/\[([^\[]+)\](\(.*\))/gm)
			if (match) {
				const linkText = /\[([^\[]+)\](\(.*\))/.exec(d.description)[1]
				d.description = linkText.trim().length > 0 ? linkText : '(Empty link)';
			}
		}
		return report;
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

	function groupByAttribute(
		report: Report<Detailed>,
		query: Query,
		nameAttr: 'project' | 'client',
		entryColor: boolean = false,
		groupColorAttr: 'project_hex_color' = null
	): ReportListGroupData[] {
		const entryMap: Map<string, ReportListGroupData> = new Map();
		const addGroup = (name: string, hex?: string) => {
			entryMap.set(name, {
				name: name ? name : `(No ${nameAttr})`,
				totalTime: 0,
				data: [],
				hex: hex
			});
		};

		// Fill the map
		for (const d of report.data) {
			if (!entryMap.has(d[nameAttr])) {
				addGroup(d[nameAttr], d[groupColorAttr]);
			}
			const group = entryMap.get(d[nameAttr]);
			group.data.push({
				name: d.description,
				totalTime: d.dur,
				count: 1,
				hex: entryColor ? d.project_hex_color : null
			});
			group.totalTime += d.dur;
		}

		return Array.from(entryMap.values());
	}

	function groupByDate(
		report: Report<Detailed>,
		query: Query
	): ReportListGroupData[] {
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

		return Array.from(entryMap.values());
	}

	// Dates are sorted (anti)chronologically
	function sortDateGroups(groups: ReportListGroupData[], order: SortOrder) {
		const _sortValue = order === SortOrder.ASC ? 1 : -1;
		return groups.sort((a, b) => {
			const _a = moment(a.name, 'LL').format('YYYY-MM-DD');
			const _b = moment(b.name, 'LL').format('YYYY-MM-DD');
			return _a > _b ? _sortValue : -_sortValue;
		});
	}

	// Projects are sorted by total time
	function sortNamedGroups(groups: ReportListGroupData[], order: SortOrder) {
		const _sortValue = order === SortOrder.ASC ? 1 : -1;
		return groups.sort((a, b) => {
			return a.totalTime > b.totalTime ? _sortValue : -_sortValue;
		});
	}
</script>

<!-- <ReportBlockHeader title="list" totalTime="0:00:00" /> -->

<TimeEntryList data={_listGroups} />
