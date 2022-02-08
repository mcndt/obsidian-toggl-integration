<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChartData } from './types';
	import * as d3 from 'd3';

	export let width: number;

	let _el: HTMLElement;

	export let data: ChartData[];

	const defaultData = [
		{
			name: '',
			value: 1,
			hex: 'var(--background-primary-alt)',
			displayValue: ''
		}
	];

	onMount(() => {
		render(data, width, 250);
	});

	const render = (data: ChartData[], width: number, height: number): void => {
		if (!data || data.length == 0) {
			data = defaultData;
		}

		const margin = {
			top: 16,
			right: 0,
			bottom: 48,
			left: 0
		};
		const radius =
			Math.min(
				width - margin.left - margin.right,
				height - margin.top - margin.bottom
			) / 2;

		const svg = d3
			.select(_el)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr(
				'transform',
				`translate(${(width - margin.left - margin.right) / 2 + margin.left}, ${
					(height - margin.top - margin.bottom) / 2 + margin.top
				})`
			);

		const arcs = d3.pie()(data.map((d) => d.value));

		const pieChart = svg
			.selectAll('pieSegments')
			.data(arcs)
			.enter()
			.append('path')
			.attr(
				'd',
				// @ts-ignore
				d3
					.arc()
					.innerRadius(0.7 * radius) // This is the size of the donut hole
					.outerRadius(radius)
			)
			.attr('fill', (d, index) => data[index].hex)
			.attr('stroke', 'var(--background-primary)')
			.style('stroke-width', '1px')
			.style('opacity', 1);

		pieChart.on('mouseover', function (d) {
			const currentBar = d3.select(this);
			currentBar.style('opacity', '0.85');
		});

		pieChart.on('mouseout', function (d) {
			const currentBar = d3.select(this);
			currentBar.style('opacity', '1');
		});

		// Add tooltips
		if (data[0].displayValue) {
			pieChart.attr('aria-label', (d, index) => data[index].displayValue);
		}
	};
</script>

<div bind:this={_el} />
