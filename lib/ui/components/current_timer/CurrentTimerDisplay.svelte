<script lang="ts">
  import CurrentTimerStopButton from "./CurrentTimerStopButton.svelte";
  import CurrentTimerStartButton from "./CurrentTimerStartButton.svelte";
  import millisecondsToTimeString, {
    secondsToTimeString,
  } from "lib/util/millisecondsToTimeString";
  import TimerTag from "./TimerTag.svelte";
  import type { TimeEntry } from "lib/model/Report-v3";
  import type { CurrentTimer } from "lib/stores/currentTimer";

  export let timer: typeof $CurrentTimer;
  export let duration: number;
</script>

<div
  id="current-timer"
  class="is-flex is-justify-content-space-between is-align-items-center"
>
  <div>
    {#if timer}
      <div id="description">
        {#if timer.description}
          <span class="timer-description">{timer.description}</span>
        {:else}
          <span class="timer-no-description">No description</span>
        {/if}
      </div>
      <div id="details" class="timer-details is-flex is-align-items-center">
        <div
          class="timer-project-circle mr-2"
          style:background-color={timer.$project?.color ?? "var(--text-muted)"}
        />
        <span
          class="timer-project-name"
          style:color={timer.$project?.color ?? "var(--text-muted)"}
          >{timer.$project?.name ?? "No project"}</span
        >
        <span class="divider-bullet mx-1">•</span>
        <span class="timer-duration">{secondsToTimeString(duration)}</span>
      </div>
      <!-- is-flex is-flex-wrap-wrap -->
      <div id="toggl-tags" class="">
        {#if timer.tags && timer.tags.length > 0}
          {#each timer.tags as tag}
            <div class="toggl-tag mr-1">
              <TimerTag name={tag} />
            </div>
          {/each}
        {/if}
      </div>
    {:else}
      <div class="timer-description no-timer-main">No active time entry</div>
      <div class="timer-details is-flex is-align-items-center">
        <span class="no-timer-subtext">Click to start new timer</span>
      </div>
    {/if}
  </div>
  <div class="ml-3 is-flex is-flex-direction-column is-justify-content-center">
    {#if timer}
      <CurrentTimerStopButton buttonSize={40} />
    {:else}
      <CurrentTimerStartButton buttonSize={40} />
    {/if}
  </div>
</div>

<style>
  #toggl-tags {
    margin-top: -0.1em;
  }

  .toggl-tag {
    float: left;
  }

  .toggl-tag:first-child {
    margin-left: -0.1em;
  }

  .timer-project-circle {
    width: 0.7em;
    height: 0.7em;
    border-radius: 50%;
  }

  .timer-description {
    font-size: 1.1em;
    font-weight: 600;
  }

  .timer-no-description {
    font-weight: 400;
    color: var(--text-muted);
    font-size: 1em;
  }

  .timer-details {
    color: var(--text-muted);
    font-size: 0.8em;
  }

  .no-timer-main {
    color: var(--text-muted);
  }

  .no-timer-subtext {
    color: var(--text-faint);
  }

  .divider-bullet {
    font-size: 10px;
  }

  .timer-duration {
    font-weight: 300;
  }
</style>
