<script lang="ts">
  import { DailySummary } from "lib/stores/dailySummary";
  import { secondsToTimeString } from "lib/util/millisecondsToTimeString";

  let list: { color: string; percentage: number; text: string }[];

  $: list = computeList($DailySummary);

  const computeList = (summary: typeof $DailySummary) => {
    const total = summary.total_seconds;

    let tmp_list = summary.projects_breakdown.map((project) => ({
      color: project.$project?.color ?? "var(--text-muted)",
      // min width = 5% (before rescaling)
      percentage: Math.max((project.tracked_seconds / total) * 100, 5),
      text: `${project.$project?.name ?? "(No project)"} (${secondsToTimeString(
        project.tracked_seconds,
      )})`,
    }));

    // Rescale the widths if necessary
    const sum = tmp_list.reduce((a, b) => a + b.percentage, 0);
    if (sum > 100) {
      tmp_list.forEach((e) => (e.percentage = (e.percentage / sum) * 100));
    }

    return tmp_list;
  };
</script>

<div>
  <div class="bar-chart mt-4 is-flex">
    {#each list as e}
      <div
        class="bar-chart-element"
        style="background-color: {e.color}; width: {e.percentage}%"
        aria-label={e.text}
      />
    {/each}
  </div>
  <div />
</div>

<style>
  .bar-chart {
    height: 20px;
    width: 100%;
  }

  .bar-chart-element {
    height: 100%;
    opacity: 0.7;
  }

  .bar-chart-element:first-child {
    border-radius: 4px 0 0 4px;
  }

  .bar-chart-element:last-child {
    border-radius: 0 4px 4px 0;
  }

  .bar-chart-element:only-child {
    border-radius: 4px;
  }
</style>
