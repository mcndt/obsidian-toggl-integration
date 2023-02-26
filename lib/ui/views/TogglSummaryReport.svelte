<script lang="ts" context="module">
  import type {
    EnrichedWithClient,
    ProjectId,
    ProjectsResponseItem,
  } from "lib/model/Report-v3";

  type SummaryGroup = {
    project_id: ProjectId;
    total_seconds: number;
    $project: EnrichedWithClient<ProjectsResponseItem>;
  };

  type Summary = {
    total_seconds: number;
    groups: SummaryGroup[];
  };

  type DateString = string;
</script>

<script lang="ts">
  import { Query, SortOrder } from "lib/reports/ReportQuery";
  import type {
    EnrichedDetailedReportItem,
    SummaryReport,
    SummaryReportStore,
  } from "lib/toggl/TogglService";
  import { secondsToTimeString } from "lib/util/millisecondsToTimeString";
  import moment from "moment";
  import BarChart from "../components/reports/charts/BarChart.svelte";
  import DonutChart from "../components/reports/charts/DonutChart.svelte";
  import type { ChartData } from "../components/reports/charts/types";
  import ProjectSummaryList from "../components/reports/lists/ProjectSummaryList.svelte";
  import type { ProjectSummaryItem } from "../components/reports/lists/types";
  import ReportBlockHeader from "../components/reports/ReportBlockHeader.svelte";
  import JsError from "./JSError.svelte";

  const BREAKPOINT = 500;
  const DONUT_WIDTH = 190;

  export let title: string = "No title";
  export let summaryStore: SummaryReportStore;
  export let query: Query;

  let barData: ChartData[];
  let barWidth: number;
  let error: string;
  let listData: ProjectSummaryItem[];
  let pieData: ChartData[];
  let width: number;

  $: barWidth = computeBarWidth(width);

  $: {
    try {
      listData = getListData($summaryStore);
      pieData = getPieData($summaryStore);
      barData = getBarData($summaryStore, query);
    } catch (err) {
      error = err.stack;
      console.error(err);
    }
  }

  function getPieData(summary: SummaryReport): ChartData[] {
    return summary.projectSummary.map((group): ChartData => {
      const groupTotalSeconds = group.sub_groups.reduce(
        (acc, subGroup) => acc + subGroup.seconds,
        0,
      );
      return {
        name: group.$project?.name ?? "(No project)",
        value: groupTotalSeconds,
        hex: group.$project?.color ?? "var(--text-muted)",
        displayValue: `${
          group.$project?.name ?? "(No project)"
        } (${secondsToTimeString(groupTotalSeconds)})`,
      };
    });
  }

  function getBarData({ timeChart }: SummaryReport, query: Query): ChartData[] {
    switch (timeChart.resolution) {
      case "day": {
        return timeChart.graph.map((item) => ({
          name: moment(item.date).format("ddd DD-M").replace(" ", "\n"),
          value: item.seconds / 60 / 60,
          displayValue: `${item.date} (${secondsToTimeString(item.seconds)})`,
        }));
      }
      case "week": {
        return timeChart.graph.map((item) => ({
          name: `Week ${moment(item.date).format("W")}\n${moment(
            item.date,
          ).format("DD-M")}`,
          value: item.seconds / 60 / 60,
          displayValue: `Week ${item.date} (${secondsToTimeString(
            item.seconds,
          )})`,
        }));
      }
      case "month": {
        return timeChart.graph.map((item) => ({
          name: `${moment(item.date).format("MMM")}`,
          value: item.seconds / 60 / 60,
          displayValue: `${item.date} (${secondsToTimeString(item.seconds)})`,
        }));
      }
      default: {
        const exhaustiveCheck: never = timeChart.resolution;
        throw new Error(`Unhandled timeChart.resolution: ${exhaustiveCheck}`);
      }
    }
  }

  function getListData(summary: SummaryReport): ProjectSummaryItem[] {
    return summary.projectSummary
      .map((group): ProjectSummaryItem => {
        const groupTotalSeconds = group.sub_groups.reduce(
          (acc, subGroup) => acc + subGroup.seconds,
          0,
        );
        return {
          title: group.$project?.name,
          hex: group.$project?.color,
          totalTime: secondsToTimeString(groupTotalSeconds),
          percent: (groupTotalSeconds / summary.timeChart.seconds) * 100,
          client_title: group.$project?.$client?.name,
        };
      })
      .sort((a, b) => {
        const aKey = query.sort ? a.percent : a.title;
        const bKey = query.sort ? b.percent : b.title;
        const sortValue = query.sort && query.sort === SortOrder.DESC ? -1 : 1;
        return aKey > bKey ? sortValue : -sortValue;
      });
  }

  function computeBarWidth(width: number): number {
    if (width >= BREAKPOINT) {
      return Math.max(0, width - DONUT_WIDTH - 24);
    }
    return width;
  }
</script>

<ReportBlockHeader
  {title}
  totalTime={secondsToTimeString($summaryStore.timeChart.seconds)}
/>

<div
  bind:clientWidth={width}
  class="is-flex is-justify-content-space-between is-align-items-center"
>
  {#if barWidth && barData && pieData}
    <BarChart data={barData} width={barWidth} />
    {#if width >= BREAKPOINT}
      {#key $summaryStore.projectSummary}
        <DonutChart data={pieData} width={DONUT_WIDTH} />
      {/key}
    {/if}
  {/if}
</div>

{#if error}
  <JsError message={error} />
{:else}
  <ProjectSummaryList data={listData} />
{/if}
