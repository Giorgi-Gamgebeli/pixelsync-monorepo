import { STYLE_KEYS } from "./constants";
import type { HtmlCssNode, StyleDraft } from "./types";

export function createEmptyStyleDraft(): StyleDraft {
  const draft: StyleDraft = {};
  for (const key of STYLE_KEYS) {
    draft[key] = "";
  }
  return draft;
}

export function labelFromStyleKey(key: string) {
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function createDefaultNode(
  index = 1,
  position?: {
    x: number;
    y: number;
  },
): HtmlCssNode {
  return {
    id: crypto.randomUUID(),
    name: `Page ${index}`,
    x: position?.x ?? 1000 + index * 60,
    y: position?.y ?? 900 + index * 60,
    w: 1920,
    h: 3000,
    html: `<main class="page-root"></main>`,
    css: `.page-root { width: 100%; height: 100%; background: #ffffff; }`,
  };
}

export function normalizeHtmlFragment(html: string): string {
  const raw = String(html ?? "").trim();
  if (!raw) return "";

  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1]?.trim() ?? "";
  }

  const htmlWithoutDocType = raw.replace(/<!doctype[^>]*>/gi, "").trim();
  const htmlTagMatch = htmlWithoutDocType.match(
    /<html[^>]*>([\s\S]*)<\/html>/i,
  );
  if (htmlTagMatch) {
    return htmlTagMatch[1]?.trim() ?? "";
  }

  return raw;
}

export function buildSrcDoc(node: HtmlCssNode) {
  const baseCss = `
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
    *, *::before, *::after { box-sizing: border-box; }
  `;
  const finalCss = `${baseCss}\n${node.css}`;
  const rawHtml = normalizeHtmlFragment(node.html ?? "");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      ${finalCss}
    </style>
  </head>
  <body>${rawHtml}</body>
</html>`;
}

export function getTagTemplate(tag: string) {
  if (tag === "img") {
    return `<img src="https://via.placeholder.com/320x180?text=Image" alt="" />`;
  }
  if (tag === "input") {
    return `<input type="text" placeholder="input" />`;
  }
  if (tag === "textarea") {
    return `<textarea placeholder="textarea"></textarea>`;
  }
  if (tag === "ul") {
    return `<ul><li>Item 1</li><li>Item 2</li></ul>`;
  }
  if (tag === "button") {
    return `<button>Button</button>`;
  }
  if (tag.startsWith("h")) {
    return `<${tag}>Heading</${tag}>`;
  }
  if (tag === "p") {
    return `<p>Paragraph text</p>`;
  }
  return `<${tag}>${tag} content</${tag}>`;
}

export function isTextInputTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (element.isContentEditable) return true;
  return Boolean(element.closest('[contenteditable="true"]'));
}

export function cloneNodes(nodes: HtmlCssNode[]): HtmlCssNode[] {
  return nodes.map((node) => ({ ...node }));
}
