<script lang="ts">
  import type { ReportListItem } from "./types";
  import TimerTag from "../../current_timer/TimerTag.svelte";
  import { secondsToTimeString } from "lib/util/millisecondsToTimeString";

  export let data: ReportListItem;
  export let showProject: boolean;
</script>

<div class="group-item mb-2 is-flex is-justify-content-space-between">
  <div
    class="is-flex is-align-items-center group-item-description is-flex-wrap-wrap"
  >
    {#if showProject}
      <div
        aria-label={data.project || "No project"}
        class="project-circle mr-2"
        style="background-color:{data.hex || 'var(--text-muted)'}"
      />
    {/if}
    {#if data.count && data.count != 1}
      <div
        class="group-item-count mr-2 is-flex is-align-items-center is-justify-content-center"
      >
        <span>{data.count}</span>
      </div>
    {/if}
    <span class="mr-2">{data.name}</span>
    {#each data.tags as tag}
      <span class="mr-1"><TimerTag name={tag} /></span>
    {/each}
  </div>
  <div class="group-item-time ml-3">
    {secondsToTimeString(data.totalTime)}
  </div>
</div>
