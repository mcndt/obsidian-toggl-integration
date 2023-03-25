import { MarkdownPreviewView } from "obsidian";

export const renderMarkdown = (markdown: string) => {
  const el = document.createElement("span");
  MarkdownPreviewView.renderMarkdown(markdown, el, "", null);
  return el.firstElementChild?.innerHTML || el.innerHTML || "———";
};
