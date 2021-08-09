<script lang="ts">
	import type { TimeEntry } from 'lib/model/TimeEntry';
	import { currentTimer } from 'lib/util/stores';
	import moment from 'moment';
	import { onDestroy } from 'svelte';
	import CurrentTimerStopButton from './CurrentTimerStopButton.svelte';
	import CurrentTimerStartButton from './CurrentTimerStartButton.svelte';
	import millisecondsToTimeString from 'lib/util/millisecondsToTimeString';

	let timer: TimeEntry;

	let hr = 0;
	let min = 0;
	let sec = 0;
	let durationString: string;

	const unsubscribe = currentTimer.subscribe((val) => {
		timer = val;
		updateDuration();
	});

	onDestroy(unsubscribe);

	function updateDuration() {
		if (timer == null) {
			return;
		}

		const start = moment(timer.start);
		const diff = moment().diff(start, 'milliseconds');
		durationString = millisecondsToTimeString(diff);

		setTimeout(updateDuration, 1000);
	}
</script>

<div
	id="current-timer"
	class="is-flex is-justify-content-space-between is-align-items-center"
>
	<div>
		{#if timer}
			<div class="timer-description">{timer.description}</div>
			<div class="timer-details is-flex is-align-items-center">
				<div
					class="timer-project-circle mr-2"
					style="background-color:{timer.project_hex_color}"
				/>
				<span
					class="timer-project-name"
					style="color: {timer.project_hex_color};">{timer.project}</span
				>
				<span class="divider-bullet mx-1">•</span>
				<span class="timer-duration">{durationString}</span>
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
	.timer-project-circle {
		width: 0.7em;
		height: 0.7em;
		border-radius: 50%;
	}

	.timer-description {
		font-size: 1.1em;
		font-weight: 600;
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
