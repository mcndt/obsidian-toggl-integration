import type { MarkdownPostProcessorContext } from 'obsidian';
import TogglReportBlock from '../ui/views/TogglReportBlock.svelte';

/**
 * Handles the rendering reports from query code.
 */
export default function reportBlockHandler(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
) {
	if (!source) {
		return;
	}

	new TogglReportBlock({ target: el, props: { source: source } });
}
