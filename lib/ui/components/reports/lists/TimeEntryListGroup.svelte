<script lang="ts">
  import type { ReportListItem } from "./types";
  import TimeEntryListRow from "./TimeEntryListRow.svelte";
  import { secondsToTimeString } from "lib/util/millisecondsToTimeString";

  export let name: string;
  export let totalTime: number;
  export let hex: string = undefined;
  export let data: ReportListItem[];
</script>

<div class="mt-5 time-entry-list">
  <div
    class="time-entry-group-header is-flex is-justify-content-space-between pb-1 mb-2"
  >
    <div class="is-flex is-align-items-center">
      {#if hex}
        <div class="project-circle mr-2" style="background-color:{hex}" />
      {/if}
      <span>{name}</span>
    </div>
    <div>{secondsToTimeString(totalTime)}</div>
  </div>
  <div class="group-items">
    {#each data as row}
      <TimeEntryListRow data={row} showProject={!hex} />
    {/each}
  </div>
</div>
