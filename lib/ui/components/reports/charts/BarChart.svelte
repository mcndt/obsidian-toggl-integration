<script lang="ts">
	import { onMount } from 'svelte';
	import type { ChartData } from './types';
	import * as d3 from 'd3';

	export let width: number;

	let _el: HTMLElement;
	let _chart: d3.Selection<SVGSVGElement, unknown, undefined, null>;

	export let data: ChartData[] = [{ name: 'unset', value: 1 }];

	onMount(() => {
		render(data, width, 250);
	});

	$: render(data, width, 250);

	/* Returns the largest value in the data arary. */
	const maxValue = (data: ChartData[]) => {
		return Math.max(...data.map((e) => e.value));
	};

	const render = (data: ChartData[], width: number, height: number): void => {
		const margin = {
			top: 24,
			right: 0,
			bottom: 48,
			left: 24
		};

		const ticks = {
			size: '0.8rem',
			textColor: 'var(--text-muted)',
			strokeColor: 'var(--background-modifier-border)',
			weight: '300',
			textHeight: margin.bottom - 24
		};

		// TODO: check if an svg element is already attached

		if (_chart != undefined) {
			_chart.remove();
		}

		const svg = d3
			.select(_el)
			.append('svg')
			.attr('width', width)
			.attr('height', height);

		const xScale = d3
			.scaleBand()
			.domain(data.map((e) => e.name))
			.range([margin.left, width - margin.right])
			.padding(0.5);

		const yScale = d3
			.scaleLinear()
			.domain([0, maxValue(data)])
			.range([height - margin.bottom, margin.top]);

		// render horizontal gridlines

		function getXTickLabelOffset(labels: any) {
			let maxWidth = 0;
			for (const label of labels) {
				const width = label.getBoundingClientRect().width;
				if (width > maxWidth) {
					maxWidth = width;
				}
			}
			return 8 + maxWidth;
		}

		svg
			.append('g')
			.call(
				d3
					.axisLeft(yScale)
					.ticks(5)
					.tickSize(-width + margin.right)
					.tickFormat((d) => `${d} h`)
			)
			.style('color', ticks.strokeColor)
			.call((g) => g.select('.domain').remove())
			.call((g) =>
				g
					.selectAll('.tick text')
					.style('color', ticks.textColor)
					.style('font-size', ticks.size)
					.style('font-family', 'var(--default-font)')
					.style('font-weight', ticks.weight)
					.attr(
						'transform',
						(val, index, nodes) =>
							`translate(${getXTickLabelOffset(nodes)}, -10)`
					)
			);

		// Render data bars

		const bars = svg.selectAll('bar').data(data).enter();

		// Render bar rectangles
		const rects = bars
			.append('rect')
			.attr('x', (d) => xScale(d.name))
			.attr('y', (d) => yScale(d.value))
			.attr('width', xScale.bandwidth())
			.style('fill', 'var(--interactive-accent)')
			.attr('height', (d) =>
				d.value > 0 ? height - margin.bottom - yScale(d.value) : 0
			);

		// NOTE: need to use 'function' syntax to access 'this' object.
		//       Does not work with lambda function notation.
		rects.on('mouseover', function (d) {
			const currentBar = d3.select(this);
			currentBar.style('fill', 'var(--interactive-accent-hover');
		});

		rects.on('mouseout', function (d) {
			const currentBar = d3.select(this);
			currentBar.style('fill', 'var(--interactive-accent');
		});

		// Add tooltips

		if (data[0].displayValue) {
			rects.attr('aria-label', (d) => d.displayValue);
		}

		// Render xtick labels
		const show_label = (text: string, index: number, length: number) => {
			if (text.length > 5) {
				if (length > 15) {
					return index % 3 == 0;
				}
				if (length > 7) {
					return index % 2 == 0;
				}
			} else {
				if (length > 21) {
					return index % 3 == 0;
				}
				if (length > 10) {
					return index % 2 == 0;
				}
			}
			return true;
		};

		const get_label_top = (data: any, index: number, series: any[]) => {
			return show_label(data.name.split('\n')[0], index, series.length)
				? data.name.split('\n')[0]
				: '';
		};

		const get_label_bottom = (data: any, index: number, series: any[]) => {
			return show_label(data.name.split('\n')[0], index, series.length)
				? data.name.includes('\n')
					? data.name.split('\n')[1]
					: ''
				: '';
		};

		const xtick_labels_line0 = bars
			.append('text')
			.text(get_label_top)
			.attr('x', (d) => xScale(d.name) + xScale.bandwidth() / 2)
			.attr('y', (d) => height - ticks.textHeight)
			.attr('dy', '0em')
			.style('text-anchor', 'middle')
			.style('fill', 'var(--text-muted)')
			.style('fill', ticks.textColor)
			.style('font-size', ticks.size)
			.style('font-weight', ticks.weight);

		const xtick_labels_line1 = bars
			.append('text')
			.text(get_label_bottom)
			.attr('x', (d) => xScale(d.name) + xScale.bandwidth() / 2)
			.attr('y', (d) => height - ticks.textHeight)
			.attr('dy', '1.2em')
			.style('text-anchor', 'middle')
			.style('fill', ticks.textColor)
			.style('font-size', ticks.size)
			.style('font-weight', ticks.weight);

		_chart = svg;
	};
</script>

<div class="is-flex-grow-2" bind:this={_el} />
