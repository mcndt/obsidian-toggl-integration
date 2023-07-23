<script lang="ts">
  import type { ClientId, ProjectId } from "lib/model/Report-v3";
  import { GroupBy, Query, SortOrder } from "lib/reports/ReportQuery";
  import type { EnrichedDetailedReportItem } from "lib/toggl/TogglService";
  import moment from "moment";
  import TimeEntryList from "../components/reports/lists/TimeEntryList.svelte";
  import type {
    ReportListGroupData,
    ReportListItem,
  } from "../components/reports/lists/types";
  import JsError from "./JSError.svelte";

  export let query: Query;
  export let detailed: EnrichedDetailedReportItem[];

  let _error: string;

  let _listGroups: ReportListGroupData[] = [];

  $: if (query && detailed) {
    try {
      _error = null;
      sanitizeData(detailed);
      _listGroups = getListGroups(detailed, query);
    } catch (err) {
      _error = err.stack;
      console.error(err);
    }
  }

  function getListGroups(
    detailed: EnrichedDetailedReportItem[],
    query: Query,
  ): ReportListGroupData[] {
    // Group entries by date or project
    let returnData: ReportListGroupData[];
    if (query.groupBy && query.groupBy !== GroupBy.DATE) {
      if (query.groupBy === GroupBy.PROJECT) {
        returnData = groupByAttribute(detailed, "project");
      } else if (query.groupBy === GroupBy.CLIENT) {
        returnData = groupByAttribute(detailed, "client");
      }
    } else {
      returnData = groupByDate(detailed, query);
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
        group.data.sort((a, b) => b.order - a.order),
      );
    } else {
      returnData.forEach((group) =>
        group.data.sort((a, b) => a.order - b.order),
      );
    }

    return returnData;
  }

  function sanitizeData(report: EnrichedDetailedReportItem[]) {
    for (const item of report) {
      // sanitize Markdown links
      const match = item.description.match(/\[([^\[]+)\](\(.*\))/gm);
      if (match) {
        const linkText = /\[([^\[]+)\](\(.*\))/.exec(item.description)[1];
        item.description =
          linkText.trim().length > 0 ? linkText : "(Empty link)";
      }

      // sort tags canonically
      if (item.$tags) {
        item.$tags.sort((a, b) => a.name.localeCompare(b.name));
      }
    }
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
    detailed: EnrichedDetailedReportItem[],
    nameAttr: "project" | "client",
  ): ReportListGroupData[] {
    const entryMap = new Map<string, ReportListGroupData>();
    const addGroup = (name: string, color?: string) => {
      entryMap.set(name, {
        name: name ? name : `(No ${nameAttr})`,
        totalTime: 0,
        data: [],
        hex: color,
      });
    };

    const getItemName = (item: EnrichedDetailedReportItem) => {
      if (nameAttr === "project") {
        return item.$project?.name;
      } else if (nameAttr === "client") {
        return item.$project?.$client?.name;
      }
    };

    // Fill the map
    for (const item of detailed) {
      const name = getItemName(item);
      const itemSeconds = item.time_entries.reduce(
        (acc, cur) => acc + cur.seconds,
        0,
      );

      if (!entryMap.has(name)) {
        addGroup(name, nameAttr === "project" ? item.$project?.color : null);
      }

      const group = entryMap.get(name);
      group.data.push({
        name: item.description,
        totalTime: itemSeconds,
        count: item.time_entries.length,
        hex: nameAttr === "client" ? item.$project?.color : null,
        order: moment(item.time_entries.first()?.start).unix(),
        tags: item.$tags?.map((t) => t.name),
        project: item.$project?.name,
      });
      group.totalTime += itemSeconds;
    }

    return Array.from(entryMap.values());
  }

  function groupByDate(
    detailed: EnrichedDetailedReportItem[],
    query: Query,
  ): ReportListGroupData[] {
    const entryMap = new Map<string, ReportListGroupData>();

    // create the empty map
    let start = moment(query.from);
    let end = moment(query.to ? query.to : query.from).add(1, "days");
    let current = start;

    while (current.diff(end, "days") !== 0) {
      entryMap.set(current.format("YYYY-MM-DD"), {
        name: current.format("LL"),
        totalTime: 0,
        data: [],
      });
      current = current.add(1, "days");
    }

    // Fill the map
    for (const item of detailed) {
      const groupKey = item.time_entries.first()?.start.slice(0, 10);
      const group = entryMap.get(groupKey);

      const itemSeconds = item.time_entries.reduce(
        (acc, cur) => acc + cur.seconds,
        0,
      );

      group.data.push({
        name: item.description,
        totalTime: itemSeconds,
        count: 1,
        hex: item.$project?.color,
        order: moment(item.time_entries.first()?.start).unix(),
        tags: item.$tags?.map((t) => t.name),
        project: item.$project?.name,
      });
      group.totalTime += itemSeconds;
    }

    return Array.from(entryMap.values());
  }

  // Dates are sorted (anti)chronologically
  function sortDateGroups(groups: ReportListGroupData[], order: SortOrder) {
    const _sortValue = order === SortOrder.ASC ? 1 : -1;
    return groups.sort((a, b) => {
      const _a = moment(a.name, "LL").format("YYYY-MM-DD");
      const _b = moment(b.name, "LL").format("YYYY-MM-DD");
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
