<script lang="ts">
  import { CurrentTimer } from "lib/stores/currentTimer";
  import { DailySummary } from "lib/stores/dailySummary";
  import { secondsToTimeString } from "lib/util/millisecondsToTimeString";
  import { settingsStore } from "lib/util/stores";

  export let duration_seconds: number;

  let list: { color: string; duration: string; name: string }[];

  $: list = computeList($DailySummary, duration_seconds);

  const computeList = (
    summary: typeof $DailySummary,
    current_timer_duration_seconds: number,
  ) => {
    return summary.projects_breakdown.map((project) => {
      const currentTimerSeconds =
        $settingsStore.updateInRealTime &&
        $CurrentTimer?.project_id === project.project_id
          ? current_timer_duration_seconds ?? 0
          : 0;

      return {
        color: project.$project?.color ?? "var(--text-muted)",
        duration: secondsToTimeString(
          project.tracked_seconds + currentTimerSeconds,
        ),
        name: project.$project?.name ?? "(No project)",
      };
    });
  };
</script>

<div>
  {#each list as e, i}
    <div class="project-row is-flex is-justify-content-space-between">
      <div class="is-flex is-align-items-center">
        <span class="project-circle" style="background-color: {e.color};" />
        <span class="ml-3 project-row-name" style="color: {e.color};">
          {e.name ? e.name : "(No project)"}
        </span>
      </div>
      <span class="project-row-duration">{e.duration}</span>
    </div>
  {/each}
</div>

<style>
  .project-row {
    font-size: 0.9em;
  }

  .project-row:not(:first-child) {
    margin-top: 0.25em;
  }

  .project-circle {
    width: 0.8em;
    height: 0.8em;
    border-radius: 50%;
  }

  .project-row-duration {
    color: var(--text-muted);
  }
</style>
