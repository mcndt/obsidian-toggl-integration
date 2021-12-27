import type { MarkdownPostProcessorContext } from 'obsidian';
import { parse } from './parser/Parse';
import { tokenize } from './parser/Tokenize';
import TogglReportBlock from '../ui/views/TogglReportBlock.svelte';

/**
 * Handles the rendering reports from query code.
 */
export default function reportBlockHandler(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
) {
	// const tokens = tokenize(source);
	// el.setText(`${tokens.map((t) => t).join(', ')}`);
	// const query = parse(source);
	new TogglReportBlock({
		target: el,
		props: {}
	});
}
