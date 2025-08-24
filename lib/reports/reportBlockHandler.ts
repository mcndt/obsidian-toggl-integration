import type { Component, MarkdownPostProcessorContext } from "obsidian";

// @ts-ignore (no default export detected by vscode's typescript language server)
import TogglReportBlock from "../ui/views/TogglReportBlock.svelte";

/**
 * Handles the rendering reports from query code.
 */
export default function reportBlockHandler(
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  component: Component,
) {
  if (!source) {
    return;
  }

  new TogglReportBlock({
    context: new Map([["component", component]]),
    props: { source: source },
    target: el,
  });
}
