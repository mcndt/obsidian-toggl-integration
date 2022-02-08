<script lang="ts">
	import type { Detailed, Report } from 'lib/model/Report';
	import { GroupBy, Query, SortOrder } from 'lib/reports/ReportQuery';
	import moment from 'moment';
	import TimeEntryList from '../components/reports/lists/TimeEntryList.svelte';
	import type {
		ReportListGroupData,
		ReportListItem
	} from '../components/reports/lists/types';
	import JsError from './JSError.svelte';

	export let query: Query;
	export let detailed: Report<Detailed>;

	let _error: string;

	let _listGroups: ReportListGroupData[] = [];

	$: if (query && detailed) {
		try {
			_error = null;
			_listGroups = getListGroups(detailed, query);
		} catch (err) {
			_error = err.stack;
			console.error(err);
		}
	}

	function getListGroups(
		report: Report<Detailed>,
		query: Query
	): ReportListGroupData[] {
		// Group entries by date or project
		report = sanitizeData(report);
		let returnData: ReportListGroupData[];
		if (query.groupBy && query.groupBy !== GroupBy.DATE) {
			if (query.groupBy === GroupBy.PROJECT) {
				returnData = groupByAttribute(
					report,
					'project',
					false,
					'project_hex_color'
				);
			} else if (query.groupBy === GroupBy.CLIENT) {
				returnData = groupByAttribute(report, 'client', true);
			}
		} else {
			returnData = groupByDate(report, query);
		}

		// Stack duplicated entries
		returnData.forEach(stackGroupItems);

		// Sort, if requested
		if (query.sort) {
			if (query.groupBy && query.groupBy !== GroupBy.DATE) {
				sortNamedGroups(returnData, query.sort);
			} else {
				sortDateGroups(returnData, query.sort);
			}
		}

		// Sort group content chronologically
		if (
			query.groupBy &&
			query.groupBy === GroupBy.DATE &&
			query.sort &&
			query.sort === SortOrder.DESC
		) {
			returnData.forEach((group) =>
				group.data.sort((a, b) => b.order - a.order)
			);
		} else {
			returnData.forEach((group) =>
				group.data.sort((a, b) => a.order - b.order)
			);
		}

		return returnData;
	}

	function sanitizeData(report: Report<Detailed>): Report<Detailed> {
		for (const entry of report.data) {
			// sanitize Markdown links
			const match = entry.description.match(/\[([^\[]+)\](\(.*\))/gm);
			if (match) {
				const linkText = /\[([^\[]+)\](\(.*\))/.exec(entry.description)[1];
				entry.description =
					linkText.trim().length > 0 ? linkText : '(Empty link)';
			}

			// sort tags canonically
			if (entry.tags) {
				entry.tags.sort();
			}
		}
		return report;
	}

	/**
	 * Stacks groups entries based on equality conditions. Two entries are equal
	 * <=> (i) the entry name is the same; (ii) the entry tags are the same.
	 * @param group the group
	 */
	function stackGroupItems(group: ReportListGroupData) {
		const getItemId = (item: ReportListItem) => {
			return `${item.name}${item.tags.join()}`;
		};

		const itemMap: Map<string, ReportListItem> = new Map();
		for (const entry of group.data) {
			const mapId = getItemId(entry);
			if (itemMap.has(mapId)) {
				const item = itemMap.get(mapId);
				item.totalTime += entry.totalTime;
				item.count += 1;
			} else {
				itemMap.set(mapId, entry);
			}
		}
		group.data = Array.from(itemMap.values());
	}

	function groupByAttribute(
		report: Report<Detailed>,
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
				hex: entryColor ? d.project_hex_color : null,
				order: moment(d.start).unix(),
				tags: d.tags,
				project: d.project
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
				hex: d.project_hex_color,
				order: moment(d.start).unix(),
				tags: d.tags,
				project: d.project
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

{#if _error}
	<JsError message={_error} />
{:else}
	<TimeEntryList data={_listGroups} />
{/if}
