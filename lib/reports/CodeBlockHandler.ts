import type { MarkdownPostProcessorContext } from 'obsidian';
import { parse } from './parser/Parse';
import { tokenize } from './parser/Tokenize';

/**
 * Handles the rendering reports from query code.
 */
export default function codeBlockHandler(
	source: string,
	el: HTMLElement,
	ctx: MarkdownPostProcessorContext
) {
	const tokens = tokenize(source);
	el.setText(`${tokens.map((t) => t).join(', ')}`);
	const query = parse(source);
}
