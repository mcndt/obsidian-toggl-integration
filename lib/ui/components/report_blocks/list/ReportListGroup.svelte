<script lang="ts">
	import type { ReportListItem } from './types';

	export let name: string;
	export let totalTime: string;
	export let hex: string = undefined;
	export let data: ReportListItem[];

	const test_data = [
		{
			name: 'Design report block in figma',
			totalTime: '3:40:54',
			hex: '#9E5BD9'
		},
		{
			name: '1q84 (Murakami, 2009)',
			totalTime: '6:13:01',
			hex: '#06A893'
		},
		{
			name: 'Capital and Ideology (Piketty, 2019)',
			totalTime: '4:25:33',
			hex: '#06A893',
			count: 2
		},
		{
			name: 'Write book review Gates2021',
			totalTime: '1:20:23',
			hex: '#E36A00',
			count: 13
		}
	];

	$: test_data_alt = test_data.map((e) => {
		return { ...e, hex: undefined };
	});
</script>

<main class="mt-5">
	<div class="time-entry-list">
		<div
			class="time-entry-group-header is-flex is-justify-content-space-between pb-1 mb-2"
		>
			<div class="is-flex is-align-items-center">
				{#if hex}
					<div class="project-circle mr-2" style="background-color:{hex}" />
				{/if}
				<span>{name}</span>
			</div>
			<div>{totalTime}</div>
		</div>
		<div class="group-items">
			{#each data as e}
				<div class="group-item mb-2 is-flex is-justify-content-space-between">
					<div class="is-flex is-align-items-center">
						{#if e.hex}
							<div
								class="project-circle mr-2"
								style="background-color:{e.hex}"
							/>
						{/if}
						{#if e.count}
							<div class="group-item-count mr-2">
								<span>{e.count}</span>
							</div>
						{/if}
						<span>{e.name}</span>
					</div>
					<div class="group-item-time">{e.totalTime}</div>
				</div>
			{/each}
		</div>
	</div>
</main>

<style>
	.time-entry-group-header {
		font-weight: 600;
		font-size: 1.1em;

		border-bottom: 2px solid var(--background-modifier-border);
	}

	.project-circle {
		width: 0.7em;
		height: 0.7em;
		border-radius: 50%;
	}

	.group-item-time {
		color: var(--text-muted);
	}

	.group-item-count {
		color: var(--text-muted);
		font-size: 0.7em;
		text-align: center;
		border-radius: 50%;
		border: 1px solid var(--background-modifier-border);
		height: 1.75em;
		width: 1.75em;
	}

	.group-item-count span {
		position: relative;
		top: 5%;
	}
</style>
