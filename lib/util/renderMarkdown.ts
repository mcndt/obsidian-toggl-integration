import { Component, MarkdownPreviewView } from "obsidian";

export const renderMarkdown = (markdown: string, component: Component) => {
  const el = document.createElement("span");
  MarkdownPreviewView.renderMarkdown(markdown, el, "", component);
  return el.firstElementChild?.innerHTML || el.innerHTML || "———";
};
