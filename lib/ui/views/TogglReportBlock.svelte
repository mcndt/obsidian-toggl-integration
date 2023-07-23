<script lang="ts">
  import type { Detailed, Report, Summary } from "lib/model/Report";
  import { parse } from "lib/reports/parser/Parse";
  import {
    Query,
    QueryType,
    SelectionMode,
    tag,
  } from "lib/reports/ReportQuery";
  import { togglService } from "lib/util/stores";
  import { onMount } from "svelte";
  import ParsingError from "./ParsingError.svelte";
  import ApiError from "./ApiError.svelte";
  import TogglSummaryReport from "./TogglSummaryReport.svelte";
  import TogglListReport from "./TogglListReport.svelte";
  import LoadingAnimation from "../components/LoadingAnimation.svelte";
  import { ISODateFormat, Keyword, Token } from "lib/reports/parser/Parser";
  import { tokenize } from "lib/reports/parser/Tokenize";
  import { getProjectIds } from "lib/stores/projects";
  import { getClientIds } from "lib/stores/clients";
  import { getTagIds } from "lib/stores/tags";
  import type { Readable } from "svelte/types/runtime/store";
  import type {
    EnrichedDetailedReportItem,
    SummaryReportStore,
  } from "lib/toggl/TogglService";
  import moment from "moment";

  export let source: string;

  let apiError: string;
  let detailed: EnrichedDetailedReportItem[];
  let parseError: string;
  let query: Query;
  let summaryStore: SummaryReportStore;
  let title: string;

  let hasError = false;
  let ready = false;

  $: if (query && !ready) {
    if (query.type === QueryType.SUMMARY) {
      ready = !!summaryStore;
    } else if (query.type === QueryType.LIST) {
      ready = !!detailed;
    }
  }

  $: hasError = !!apiError || !!parseError;

  onMount(async () => {
    try {
      query = parseQuery(source);
    } catch (err) {
      parseError = err.message;
      return;
    }

    try {
      if (query.type === QueryType.SUMMARY) {
        summaryStore = await getSummaryReport(query);
      } else if (query.type === QueryType.LIST) {
        const report = await getDetailedReport(query);
        detailed = filterDetailedReport(report, query);
      }
    } catch (err) {
      apiError = err.message;
      return;
    }
  });

  function parseQuery(source: string): Query {
    const tokens = tokenize(source);
    const query: Query = parse(source);
    title = query.customTitle ? query.customTitle : getTitle(tokens);
    return query;
  }

  function getTitle(tokens: Token[]): string {
    switch (tokens[1]) {
      case Keyword.TODAY:
        return "Today";
      case Keyword.WEEK:
        return "This week";
      case Keyword.MONTH:
        return "This month";
      case Keyword.FROM:
        return `${tokens[2]} to ${(tokens[4] as string).toLowerCase()}`;
      case Keyword.PAST:
        return `Past ${tokens[2]} ${(<string>tokens[3]).toLowerCase()}`;
      default:
        const defaultDate = moment(tokens[1], ISODateFormat, true);
        if (defaultDate.isValid()) {
          return defaultDate.format("LL");
        }
        return "Untitled Toggl Report";
    }
  }

  async function getDetailedReport(query: Query) {
    return await $togglService.getEnrichedDetailedReport(query);
  }

  async function getSummaryReport(query: Query) {
    return $togglService.getSummaryReport(query);
  }

  function filterDetailedReport(
    report: EnrichedDetailedReportItem[],
    query: Query,
  ) {
    // NOTE: INCLUDE filters have already been applied at query time, only need
    // to filter by EXCLUDE here.
    const projectIds =
      query.projectSelection?.mode === SelectionMode.EXCLUDE
        ? getProjectIds(query.projectSelection.list)
        : [];

    const clientIds =
      query.clientSelection?.mode === SelectionMode.EXCLUDE
        ? getClientIds(query.clientSelection.list)
        : [];

    const tagIds = query.excludedTags ? getTagIds(query.excludedTags) : [];

    return report.filter((item) => {
      return (
        (!projectIds.length || !projectIds.includes(item.project_id)) &&
        (!clientIds.length || !clientIds.includes(item.$project.client_id)) &&
        (!tagIds.length ||
          tagIds.filter((id) => item.tag_ids.includes(id)).length === 0)
      );
    });
  }
</script>

<div class="container my-5">
  {#if parseError}
    <ParsingError query={source} message={parseError} />
  {/if}

  {#if apiError}
    <ApiError message={apiError} />
  {/if}

  {#if ready && !hasError}
    {#if query.type === QueryType.SUMMARY}
      <TogglSummaryReport {title} {summaryStore} {query} />
    {:else if query.type === QueryType.LIST}
      <TogglListReport {detailed} {query} />
    {/if}
  {/if}

  {#if !ready && !hasError}
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
