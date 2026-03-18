"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import InfiniteViewer from "react-infinite-viewer";
import Moveable from "react-moveable";
import InviteModal from "../InviteModal";
import toast from "react-hot-toast";
import {
  getHtmlCssBoardPayload,
  saveHtmlCssBoardPayload,
} from "@/app/_dataAccessLayer/actions";

type HtmlCssBoardRoomProps = {
  roomId: number;
  roomName: string;
  projectId: string;
  onlineCount: number;
};

type HtmlCssNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  html: string;
  css: string;
};

type TagTreeNode = {
  cid: string;
  tagName: string;
  children: TagTreeNode[];
};

type StyleDraft = Record<string, string>;
type TagDropPlacement = "before" | "inside" | "after";

const BOARD_WIDTH = 12000;
const BOARD_HEIGHT = 12000;
const PAGE_PRESETS = [
  { key: "mobile", label: "Mobile 390 x 844", w: 390, h: 844 },
  { key: "tablet", label: "Tablet 768 x 1024", w: 768, h: 1024 },
  { key: "laptop", label: "Laptop 1366 x 1800", w: 1366, h: 1800 },
  { key: "desktop", label: "Desktop 1440 x 2200", w: 1440, h: 2200 },
  { key: "fullhd", label: "Full HD 1920 x 3000", w: 1920, h: 3000 },
] as const;
const TAG_OPTIONS = [
  "div",
  "section",
  "article",
  "header",
  "main",
  "footer",
  "nav",
  "aside",
  "h1",
  "h2",
  "h3",
  "p",
  "span",
  "button",
  "input",
  "textarea",
  "img",
  "ul",
  "li",
];

const STYLE_GROUPS = [
  {
    title: "Layout & Flow",
    keys: [
      "display",
      "position",
      "width",
      "height",
      "top",
      "left",
      "right",
      "bottom",
      "padding",
      "margin",
      "gap",
      "flex-direction",
      "justify-content",
      "align-items",
    ],
  },
  {
    title: "Visual & Color",
    keys: ["background-color", "color", "border", "border-radius"],
  },
  {
    title: "Typography",
    keys: ["font-size", "font-weight"],
  },
] as const;

const STYLE_KEYS = STYLE_GROUPS.flatMap((group) => group.keys);

const STYLE_SELECT_OPTIONS: Record<string, string[]> = {
  display: ["", "block", "inline-block", "inline", "flex", "grid", "none"],
  position: ["", "static", "relative", "absolute", "fixed", "sticky"],
  "flex-direction": ["", "row", "column", "row-reverse", "column-reverse"],
  "justify-content": [
    "",
    "flex-start",
    "center",
    "flex-end",
    "space-between",
    "space-around",
    "space-evenly",
  ],
  "align-items": [
    "",
    "stretch",
    "flex-start",
    "center",
    "flex-end",
    "baseline",
  ],
};

function createEmptyStyleDraft(): StyleDraft {
  const draft: StyleDraft = {};
  for (const key of STYLE_KEYS) {
    draft[key] = "";
  }
  return draft;
}

function labelFromStyleKey(key: string) {
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createDefaultNode(index = 1): HtmlCssNode {
  return {
    id: crypto.randomUUID(),
    name: `Page ${index}`,
    x: 1000 + index * 60,
    y: 900 + index * 60,
    w: 1920,
    h: 3000,
    html: `<main class="page-root"></main>`,
    css: `.page-root { width: 100%; height: 100%; background: #ffffff; }`,
  };
}

function buildSrcDoc(node: HtmlCssNode) {
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

function getTagTemplate(tag: string) {
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

function isTextInputTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (element.isContentEditable) return true;
  return Boolean(element.closest('[contenteditable="true"]'));
}

function cloneNodes(nodes: HtmlCssNode[]): HtmlCssNode[] {
  return nodes.map((node) => ({ ...node }));
}

function normalizeHtmlFragment(html: string): string {
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

export default function HtmlCssBoardRoom({
  roomId,
  roomName,
  projectId,
  onlineCount,
}: HtmlCssBoardRoomProps) {
  const [layersOpen, setLayersOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [nodes, setNodes] = useState<HtmlCssNode[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<HTMLElement[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [boardZoom, setBoardZoom] = useState(1);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const [importTag, setImportTag] = useState("div");
  const [importAsChild, setImportAsChild] = useState(true);
  const [importSnippet, setImportSnippet] = useState("");
  const [selectedHtmlTag, setSelectedHtmlTag] = useState("(none)");
  const [selectedTagCid, setSelectedTagCid] = useState<string | null>(null);
  const [moveTargetCid, setMoveTargetCid] = useState("");
  const [dragTagCid, setDragTagCid] = useState<string | null>(null);
  const [tagDropHint, setTagDropHint] = useState<{
    targetCid: string;
    placement: TagDropPlacement;
  } | null>(null);
  const [tagTree, setTagTree] = useState<TagTreeNode[]>([]);
  const [styleDraft, setStyleDraft] = useState<StyleDraft>(
    createEmptyStyleDraft,
  );
  const [selectedTagText, setSelectedTagText] = useState("");
  const [editFitPercent, setEditFitPercent] = useState(100);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const moveableRef = useRef<Moveable | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef("");
  const zoomAnimationFrameRef = useRef<number | null>(null);
  const targetZoomRef = useRef(1);
  const zoomPointerRef = useRef<{ x: number; y: number } | null>(null);
  const previousNodesRef = useRef<HtmlCssNode[] | null>(null);
  const undoStackRef = useRef<HtmlCssNode[][]>([]);
  const redoStackRef = useRef<HtmlCssNode[][]>([]);
  const skipHistoryRef = useRef(false);

  const grapesCanvasRef = useRef<HTMLDivElement | null>(null);
  const grapesEditorRef = useRef<any>(null);
  const grapesSyncingRef = useRef(false);
  const activeNodeIdRef = useRef<string | null>(null);
  const previewFrameCleanupRef = useRef<Map<HTMLIFrameElement, () => void>>(
    new Map(),
  );
  const previewFrameMetaRef = useRef<
    Map<HTMLIFrameElement, { nodeId: string; mode: "board" | "edit" }>
  >(new Map());
  const pendingPreviewPathRef = useRef<{
    nodeId: string;
    path: number[];
  } | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedIds[0]) ?? null,
    [nodes, selectedIds],
  );

  const moveTargetOptions = useMemo(() => {
    const options: Array<{ cid: string; label: string }> = [];
    const walk = (items: TagTreeNode[], depth: number) => {
      for (const item of items) {
        if (item.cid !== selectedTagCid) {
          const name = item.tagName.startsWith("#")
            ? item.tagName
            : `<${item.tagName}>`;
          options.push({
            cid: item.cid,
            label: `${"  ".repeat(depth)}${name}`,
          });
        }
        if (item.children.length > 0) {
          walk(item.children, depth + 1);
        }
      }
    };
    walk(tagTree, 0);
    return options;
  }, [tagTree, selectedTagCid]);

  const syncActiveNodeFromEditor = (editor: any) => {
    const nodeId = activeNodeIdRef.current ?? selectedNode?.id ?? null;
    if (!nodeId) return;

    const html = normalizeHtmlFragment(editor?.getHtml?.() ?? "");
    const css = editor?.getCss?.() || "";
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, html, css } : node)),
    );
  };

  const getViewerZoom = () => {
    const viewer = viewerRef.current;
    if (!viewer) return boardZoom;
    const next = Number(viewer.getZoom?.() ?? boardZoom);
    return Number.isFinite(next) ? next : boardZoom;
  };

  const setViewerZoom = (
    nextZoom: number,
    zoomOffset?: {
      x: number;
      y: number;
    },
  ) => {
    const clamped = Math.max(0.1, Math.min(4, nextZoom));
    const viewer = viewerRef.current;

    if (!viewer) {
      setBoardZoom(clamped);
      return;
    }

    const container = viewer.getContainer?.() as HTMLElement | undefined;
    const centerX = container ? container.clientWidth / 2 : 0;
    const centerY = container ? container.clientHeight / 2 : 0;

    viewer.setZoom(clamped, {
      zoomBase: "screen",
      zoomOffsetX: zoomOffset?.x ?? centerX,
      zoomOffsetY: zoomOffset?.y ?? centerY,
    });

    setBoardZoom(clamped);
  };

  const setViewerZoomSmooth = (
    nextZoom: number,
    zoomOffset?: {
      x: number;
      y: number;
    },
  ) => {
    targetZoomRef.current = Math.max(0.1, Math.min(4, nextZoom));
    if (zoomOffset) {
      zoomPointerRef.current = zoomOffset;
    }

    if (zoomAnimationFrameRef.current !== null) return;

    const tick = () => {
      const current = getViewerZoom();
      const target = targetZoomRef.current;
      const delta = target - current;
      const pointer = zoomPointerRef.current ?? undefined;

      if (Math.abs(delta) < 0.001) {
        setViewerZoom(target, pointer);
        zoomAnimationFrameRef.current = null;
        return;
      }

      setViewerZoom(current + delta * 0.28, pointer);
      zoomAnimationFrameRef.current = requestAnimationFrame(tick);
    };

    zoomAnimationFrameRef.current = requestAnimationFrame(tick);
  };

  const zoomIn = () => setViewerZoomSmooth(getViewerZoom() * 1.1);
  const zoomOut = () => setViewerZoomSmooth(getViewerZoom() / 1.1);
  const resetZoom = () => setViewerZoomSmooth(1);

  const fitEditorCanvasToNode = (editor: any, node: HtmlCssNode | null) => {
    if (!editor || !node) return;
    const host = grapesCanvasRef.current;
    if (!host) return;

    const pageWidth = Math.max(1, Math.round(Number(node.w) || 1));
    const pageHeight = Math.max(1, Math.round(Number(node.h) || 1));
    const frameElement =
      editor.Canvas?.getFrameEl?.() as HTMLIFrameElement | null;
    const frameWrapper = frameElement?.parentElement as HTMLElement | null;

    if (frameElement) {
      frameElement.style.width = `${pageWidth}px`;
      frameElement.style.height = `${pageHeight}px`;
      frameElement.style.background = "transparent";
    }

    if (frameWrapper) {
      frameWrapper.style.width = `${pageWidth}px`;
      frameWrapper.style.height = `${pageHeight}px`;
      frameWrapper.style.margin = "0";
      frameWrapper.style.transformOrigin = "top left";
    }

    const availableWidth = Math.max(1, host.clientWidth);
    const zoomPercent = Math.max(
      5,
      Math.min(100, Math.floor((availableWidth / pageWidth) * 100)),
    );
    const scale = zoomPercent / 100;
    setEditFitPercent(zoomPercent);

    if (typeof editor.Canvas?.setZoom === "function") {
      // Keep GrapesJS canvas at 100% and scale only the page frame itself.
      editor.Canvas.setZoom(100);
    }

    if (frameWrapper) {
      frameWrapper.style.transform = `scale(${scale})`;
      const framesScroller = frameWrapper.parentElement as HTMLElement | null;
      if (framesScroller) {
        framesScroller.scrollLeft = 0;
      }
    }
  };

  const toComponentArray = (collection: any): any[] => {
    if (!collection) return [];
    if (Array.isArray(collection)) return collection;
    if (Array.isArray(collection.models)) return collection.models;
    if (typeof collection.toArray === "function") {
      const asArray = collection.toArray();
      if (Array.isArray(asArray)) return asArray;
    }
    if (typeof collection.map === "function") {
      const asArray = collection.map((item: any) => item);
      if (Array.isArray(asArray)) return asArray;
    }
    if (typeof collection.forEach === "function") {
      const asArray: any[] = [];
      collection.forEach((item: any) => asArray.push(item));
      if (asArray.length > 0) return asArray;
    }
    if (typeof collection.each === "function") {
      const asArray: any[] = [];
      collection.each((item: any) => asArray.push(item));
      if (asArray.length > 0) return asArray;
    }
    if (
      typeof collection.at === "function" &&
      Number.isFinite(collection.length)
    ) {
      const asArray: any[] = [];
      for (let index = 0; index < Number(collection.length); index += 1) {
        const item = collection.at(index);
        if (item) asArray.push(item);
      }
      return asArray;
    }
    return [];
  };

  const getComponentChildren = (component: any): any[] => {
    const collection = component?.components?.();
    return toComponentArray(collection);
  };

  const getLastComponentFromInsertResult = (result: any): any => {
    const inserted = toComponentArray(result);
    if (inserted.length > 0) return inserted[inserted.length - 1];
    if (result?.cid) return result;
    return null;
  };

  const readStyleDraft = (component: any): StyleDraft => {
    const next = createEmptyStyleDraft();
    const style = (component?.getStyle?.() ?? {}) as Record<string, unknown>;
    for (const key of STYLE_KEYS) {
      const value = style[key];
      next[key] = typeof value === "string" ? value : "";
    }
    return next;
  };

  const readComponentText = (component: any): string => {
    if (!component) return "";
    const direct = String(component?.get?.("content") ?? "");
    if (direct.trim()) return direct;

    const childText = getComponentChildren(component)
      .filter((child) => {
        const type = String(child?.get?.("type") ?? "")
          .toLowerCase()
          .trim();
        return type === "textnode" || type === "text";
      })
      .map((child) => String(child?.get?.("content") ?? ""))
      .join("")
      .trim();

    return childText;
  };

  const buildTagTreeNode = (component: any): TagTreeNode | null => {
    const type = String(component?.get?.("type") ?? "")
      .toLowerCase()
      .trim();
    const rawTag = String(component?.get?.("tagName") ?? "")
      .toLowerCase()
      .trim();

    const children = getComponentChildren(component)
      .map((child) => buildTagTreeNode(child))
      .filter(Boolean) as TagTreeNode[];

    // Hide only raw text nodes; GrapesJS "text" components are still element tags.
    if (type === "textnode") {
      return null;
    }

    let tagName = rawTag;
    if (!tagName) {
      if (type === "textnode") {
        tagName = "#text";
      } else if (type) {
        tagName = type;
      } else {
        tagName = "node";
      }
    }

    return {
      cid: String(component?.cid ?? crypto.randomUUID()),
      tagName,
      children,
    };
  };

  const rebuildTagTree = () => {
    const editor = grapesEditorRef.current;
    if (!editor) {
      setTagTree([]);
      return;
    }
    const wrapper = editor.getWrapper?.();
    if (!wrapper) {
      setTagTree([]);
      return;
    }
    const rootNode = buildTagTreeNode(wrapper);
    setTagTree(rootNode ? [rootNode] : []);
  };

  const findComponentByCid = (component: any, cid: string): any => {
    if (!component) return null;
    if (String(component.cid) === cid) return component;
    const children = getComponentChildren(component);
    for (const child of children) {
      const found = findComponentByCid(child, cid);
      if (found) return found;
    }
    return null;
  };

  const componentTreeContainsCid = (component: any, cid: string): boolean => {
    if (!component) return false;
    if (String(component.cid) === cid) return true;
    const children = getComponentChildren(component);
    for (const child of children) {
      if (componentTreeContainsCid(child, cid)) return true;
    }
    return false;
  };

  const getElementChildrenComponents = (component: any): any[] => {
    return getComponentChildren(component).filter((child) => {
      const type = String(child?.get?.("type") ?? "")
        .toLowerCase()
        .trim();
      return type !== "textnode";
    });
  };

  const getDomElementPath = (
    target: globalThis.Element,
    body: HTMLElement,
  ): number[] => {
    const path: number[] = [];
    let current: globalThis.Element | null = target;

    while (current && current !== body) {
      const parentElement: HTMLElement | null = current.parentElement;
      if (!parentElement) break;
      const index = Array.from(parentElement.children).indexOf(current);
      if (index < 0) break;
      path.unshift(index);
      current = parentElement;
    }

    return path;
  };

  const findComponentByDomPath = (wrapper: any, path: number[]): any => {
    let current = wrapper;
    for (const index of path) {
      const children = getElementChildrenComponents(current);
      const next = children[index];
      if (!next) return null;
      current = next;
    }
    return current;
  };

  const selectTagFromDomPath = (path: number[]) => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;

    const component = findComponentByDomPath(wrapper, path);
    if (!component) return;

    editor.select(component);
    setSelectedTagCid(String(component?.cid ?? ""));
    setSelectedHtmlTag(
      String(component?.get?.("tagName") ?? "(none)").toLowerCase(),
    );
    setStyleDraft(readStyleDraft(component));
    setSelectedTagText(readComponentText(component));
  };

  const getComponentPathFromWrapper = (
    wrapper: any,
    targetCid: string,
    path: number[] = [],
  ): number[] | null => {
    if (!wrapper) return null;
    if (String(wrapper?.cid) === String(targetCid)) return path;

    const children = getElementChildrenComponents(wrapper);
    for (let index = 0; index < children.length; index += 1) {
      const found = getComponentPathFromWrapper(children[index], targetCid, [
        ...path,
        index,
      ]);
      if (found) return found;
    }
    return null;
  };

  const getDomByPath = (body: HTMLElement, path: number[]): Element | null => {
    if (path.length === 0) return body;
    let current: Element = body;
    for (const index of path) {
      const next = current.children.item(index);
      if (!next) return null;
      current = next;
    }
    return current;
  };

  const ensurePreviewSelectorStyle = (doc: Document) => {
    if (!doc.head) return;
    if (doc.getElementById("pixelsync-preview-selector-style")) return;
    const style = doc.createElement("style");
    style.id = "pixelsync-preview-selector-style";
    style.textContent = `
      [data-pixelsync-selected-tag="true"] {
        outline: 2px solid #22d3ee !important;
        outline-offset: -1px !important;
        box-shadow: inset 0 0 0 1px #0891b2 !important;
      }
    `;
    doc.head.appendChild(style);
  };

  const clearPreviewSelection = (doc: Document) => {
    doc
      .querySelectorAll("[data-pixelsync-selected-tag='true']")
      .forEach((el) => el.removeAttribute("data-pixelsync-selected-tag"));
  };

  const applyPreviewSelectionToFrame = (
    iframe: HTMLIFrameElement,
    nodeId: string,
  ) => {
    const doc = iframe.contentDocument;
    if (!doc?.body) return;

    ensurePreviewSelectorStyle(doc);
    clearPreviewSelection(doc);

    if (!selectedNode || selectedNode.id !== nodeId || !selectedTagCid) return;

    const editor = grapesEditorRef.current;
    const wrapper = editor?.getWrapper?.();
    if (!wrapper) return;

    const path = getComponentPathFromWrapper(wrapper, selectedTagCid);
    if (!path) return;

    const element = getDomByPath(doc.body, path);
    if (!element) return;

    element.setAttribute("data-pixelsync-selected-tag", "true");
  };

  const bindPreviewFrame = (
    iframe: HTMLIFrameElement | null,
    nodeId: string,
    mode: "board" | "edit",
  ) => {
    if (!iframe) return;

    const existingCleanup = previewFrameCleanupRef.current.get(iframe);
    if (existingCleanup) {
      existingCleanup();
      previewFrameCleanupRef.current.delete(iframe);
      previewFrameMetaRef.current.delete(iframe);
    }

    const doc = iframe.contentDocument;
    if (!doc?.body) return;

    const handleMouseDown = (event: MouseEvent) => {
      const rawTarget = event.target as Node | null;
      const target =
        rawTarget instanceof Element
          ? rawTarget
          : (rawTarget?.parentElement ?? null);
      if (!target) return;

      if (mode === "board") {
        setSelectedIds([nodeId]);
      }

      const path = getDomElementPath(target, doc.body);
      if (activeNodeIdRef.current !== nodeId) {
        pendingPreviewPathRef.current = { nodeId, path };
        return;
      }
      selectTagFromDomPath(path);
    };

    const handleWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      event.stopPropagation();

      if (mode !== "board") return;

      const viewer = viewerRef.current;
      const wheelContainer = viewer?.getContainer?.() as
        | HTMLElement
        | undefined;
      if (!wheelContainer) return;

      const frameRect = iframe.getBoundingClientRect();
      const viewerRect = wheelContainer.getBoundingClientRect();
      const globalX = frameRect.left + event.clientX;
      const globalY = frameRect.top + event.clientY;
      const offsetX = globalX - viewerRect.left;
      const offsetY = globalY - viewerRect.top;
      const normalizedDelta = Math.max(-60, Math.min(60, event.deltaY));
      const factor = Math.exp(-normalizedDelta * 0.0012);
      const nextZoom = getViewerZoom() * factor;

      setViewerZoomSmooth(nextZoom, { x: offsetX, y: offsetY });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      const code = event.code;
      const isZoomHotkey =
        key === "=" ||
        key === "+" ||
        key === "-" ||
        key === "_" ||
        key === "0" ||
        code === "NumpadAdd" ||
        code === "NumpadSubtract";
      if (!isZoomHotkey) return;

      event.preventDefault();
      event.stopPropagation();

      if (mode !== "board") return;

      if (key === "0") {
        resetZoom();
        return;
      }
      if (key === "-" || key === "_" || code === "NumpadSubtract") {
        zoomOut();
        return;
      }
      zoomIn();
    };

    doc.addEventListener("mousedown", handleMouseDown, true);
    doc.addEventListener("wheel", handleWheel, { passive: false });
    doc.addEventListener("keydown", handleKeyDown, true);

    previewFrameMetaRef.current.set(iframe, { nodeId, mode });
    applyPreviewSelectionToFrame(iframe, nodeId);

    previewFrameCleanupRef.current.set(iframe, () => {
      doc.removeEventListener("mousedown", handleMouseDown, true);
      doc.removeEventListener("wheel", handleWheel as EventListener);
      doc.removeEventListener("keydown", handleKeyDown, true);
      previewFrameMetaRef.current.delete(iframe);
    });
  };

  useEffect(() => {
    const load = async () => {
      const payload = await getHtmlCssBoardPayload(roomId);

      if (payload && typeof payload === "object" && "error" in payload) {
        toast.error(payload.error);
        const fallback = createDefaultNode(1);
        setNodes([fallback]);
        setSelectedIds([fallback.id]);
        setIsReady(true);
        return;
      }

      const nextNodes =
        payload &&
        "nodes" in payload &&
        Array.isArray(payload.nodes) &&
        payload.nodes.length > 0
          ? payload.nodes
          : [createDefaultNode(1)];

      setNodes(nextNodes);
      setSelectedIds(nextNodes[0] ? [nextNodes[0].id] : []);
      setIsReady(true);
    };

    load();

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (zoomAnimationFrameRef.current !== null) {
        cancelAnimationFrame(zoomAnimationFrameRef.current);
        zoomAnimationFrameRef.current = null;
      }
    };
  }, [roomId]);

  useEffect(() => {
    if (!isReady) return;

    const payload = JSON.stringify({ nodes });
    if (payload === lastPayloadRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const result = await saveHtmlCssBoardPayload(roomId, payload);
      if (result && typeof result === "object" && "error" in result) {
        toast.error("Failed to save HTML/CSS board");
        return;
      }
      lastPayloadRef.current = payload;
    }, 750);
  }, [isReady, nodes, roomId]);

  useEffect(() => {
    if (!isReady) return;

    const previous = previousNodesRef.current;
    if (!previous) {
      previousNodesRef.current = cloneNodes(nodes);
      return;
    }

    const previousJson = JSON.stringify(previous);
    const currentJson = JSON.stringify(nodes);
    if (previousJson === currentJson) return;

    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      previousNodesRef.current = cloneNodes(nodes);
      return;
    }

    undoStackRef.current.push(cloneNodes(previous));
    if (undoStackRef.current.length > 100) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    previousNodesRef.current = cloneNodes(nodes);
  }, [isReady, nodes]);

  useEffect(() => {
    if (editMode || !boardRef.current) {
      setSelectedTargets([]);
      return;
    }

    const targets = selectedIds
      .map((id) => boardRef.current?.querySelector(`[data-node-id="${id}"]`))
      .filter(Boolean) as HTMLElement[];

    setSelectedTargets(targets);
  }, [editMode, nodes, selectedIds]);

  useEffect(() => {
    if (!isReady || editMode) return;

    const viewer = viewerRef.current;
    if (!viewer) return;

    const wheelContainer = viewer.getContainer?.() as HTMLElement | undefined;

    if (!wheelContainer) return;

    const handleWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;

      event.preventDefault();

      const rect = wheelContainer.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const normalizedDelta = Math.max(-60, Math.min(60, event.deltaY));
      const factor = Math.exp(-normalizedDelta * 0.0012);
      const nextZoom = getViewerZoom() * factor;

      setViewerZoomSmooth(nextZoom, { x: offsetX, y: offsetY });
    };

    wheelContainer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      wheelContainer.removeEventListener("wheel", handleWheel);
    };
  }, [editMode, isReady]);

  useEffect(() => {
    if (editMode) {
      setIsSpacePressed(false);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (isTextInputTarget(event.target)) return;
      event.preventDefault();
      setIsSpacePressed(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      setIsSpacePressed(false);
    };

    const handleBlur = () => setIsSpacePressed(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [editMode]);

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if (isTextInputTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const hasMeta = event.ctrlKey || event.metaKey;
      const code = event.code;

      if (
        !editMode &&
        hasMeta &&
        (key === "=" ||
          key === "+" ||
          key === "-" ||
          key === "_" ||
          key === "0" ||
          code === "NumpadAdd" ||
          code === "NumpadSubtract")
      ) {
        event.preventDefault();
        if (key === "0") {
          resetZoom();
          return;
        }
        if (key === "-" || key === "_" || code === "NumpadSubtract") {
          zoomOut();
          return;
        }
        zoomIn();
        return;
      }

      if (!editMode && (key === "delete" || key === "backspace")) {
        if (selectedIds.length === 0) return;
        event.preventDefault();
        deleteSelected();
        return;
      }

      if (hasMeta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redoBoard();
        } else {
          undoBoard();
        }
        return;
      }

      if (hasMeta && key === "y") {
        event.preventDefault();
        redoBoard();
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [editMode, selectedIds, nodes]);

  useEffect(() => {
    if (grapesEditorRef.current || !grapesCanvasRef.current || !selectedNode)
      return;

    let cancelled = false;

    const ensureStylesheet = () => {
      if (document.getElementById("grapesjs-css-cdn")) return;
      const link = document.createElement("link");
      link.id = "grapesjs-css-cdn";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/grapesjs/dist/css/grapes.min.css";
      document.head.appendChild(link);
    };

    const init = async () => {
      ensureStylesheet();
      const grapesjs = (await import("grapesjs")).default;
      if (cancelled || !grapesCanvasRef.current) return;

      const editor = grapesjs.init({
        container: grapesCanvasRef.current,
        width: "100%",
        height: "100%",
        storageManager: false,
        panels: { defaults: [] },
      });

      const refreshTreeFromEditor = () => {
        if (grapesSyncingRef.current) return;
        syncActiveNodeFromEditor(editor);
        rebuildTagTree();
      };

      editor.on("update", refreshTreeFromEditor);
      editor.on("component:add", refreshTreeFromEditor);
      editor.on("component:remove", refreshTreeFromEditor);
      editor.on("component:update", refreshTreeFromEditor);
      editor.on("component:drag:end", refreshTreeFromEditor);

      editor.on("component:selected", (component: any) => {
        const tagName = String(
          component?.get?.("tagName") ?? "(none)",
        ).toLowerCase();
        setSelectedHtmlTag(tagName || "(none)");
        setSelectedTagCid(component?.cid ? String(component.cid) : null);
        setStyleDraft(readStyleDraft(component));
        setSelectedTagText(readComponentText(component));
      });

      editor.on("component:deselected", () => {
        setSelectedHtmlTag("(none)");
        setSelectedTagCid(null);
        setStyleDraft(createEmptyStyleDraft());
        setSelectedTagText("");
      });

      grapesEditorRef.current = editor;

      activeNodeIdRef.current = selectedNode.id;
      grapesSyncingRef.current = true;
      editor.setComponents(normalizeHtmlFragment(selectedNode.html));
      editor.setStyle(selectedNode.css);
      grapesSyncingRef.current = false;
      rebuildTagTree();
      requestAnimationFrame(() => {
        editor.refresh?.();
        fitEditorCanvasToNode(editor, selectedNode);
      });
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [selectedNode?.id]);

  useEffect(() => {
    return () => {
      for (const cleanup of previewFrameCleanupRef.current.values()) {
        cleanup();
      }
      previewFrameCleanupRef.current.clear();
      previewFrameMetaRef.current.clear();
      if (grapesEditorRef.current) {
        grapesEditorRef.current.destroy();
        grapesEditorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!grapesEditorRef.current) return;
    const editor = grapesEditorRef.current;

    if (!selectedNode) {
      activeNodeIdRef.current = null;
      pendingPreviewPathRef.current = null;
      setSelectedHtmlTag("(none)");
      setSelectedTagCid(null);
      setTagTree([]);
      setStyleDraft(createEmptyStyleDraft());
      setSelectedTagText("");
      return;
    }

    activeNodeIdRef.current = selectedNode.id;
    grapesSyncingRef.current = true;
    editor.setComponents(normalizeHtmlFragment(selectedNode.html));
    editor.setStyle(selectedNode.css);
    grapesSyncingRef.current = false;
    requestAnimationFrame(() => {
      editor.refresh?.();
      fitEditorCanvasToNode(editor, selectedNode);
    });

    const wrapper = editor.getWrapper?.();
    if (wrapper) {
      editor.select(wrapper);
      setSelectedHtmlTag(
        String(wrapper.get?.("tagName") ?? "body").toLowerCase(),
      );
      setSelectedTagCid(String(wrapper.cid ?? ""));
      setStyleDraft(readStyleDraft(wrapper));
      setSelectedTagText(readComponentText(wrapper));
    }
    rebuildTagTree();

    const pending = pendingPreviewPathRef.current;
    if (pending && pending.nodeId === selectedNode.id) {
      selectTagFromDomPath(pending.path);
      pendingPreviewPathRef.current = null;
    }
  }, [selectedNode?.id]);

  useEffect(() => {
    if (editMode && !selectedNode) {
      setEditMode(false);
    }
  }, [editMode, selectedNode]);

  useEffect(() => {
    if (!editMode || !selectedNode) return;
    const editor = grapesEditorRef.current;
    if (!editor) return;

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        grapesSyncingRef.current = true;
        editor.setComponents("");
        editor.setStyle("");
        grapesSyncingRef.current = false;

        grapesSyncingRef.current = true;
        editor.setComponents(normalizeHtmlFragment(selectedNode.html));
        editor.setStyle(selectedNode.css);
        grapesSyncingRef.current = false;

        const wrapper = editor.getWrapper?.();
        if (wrapper) {
          editor.select(wrapper);
          setSelectedTagCid(String(wrapper.cid ?? ""));
          setSelectedHtmlTag(
            String(wrapper.get?.("tagName") ?? "body").toLowerCase(),
          );
          setStyleDraft(readStyleDraft(wrapper));
          setSelectedTagText(readComponentText(wrapper));
        }

        editor.refresh?.();
        fitEditorCanvasToNode(editor, selectedNode);
        rebuildTagTree();
      });
      void raf2;
    });

    return () => {
      cancelAnimationFrame(raf1);
    };
  }, [editMode, selectedNode?.id]);

  useEffect(() => {
    if (!selectedTagCid) {
      setMoveTargetCid("");
      return;
    }
    if (moveTargetCid === selectedTagCid) {
      setMoveTargetCid("");
    }
  }, [moveTargetCid, selectedTagCid]);

  useEffect(() => {
    for (const [iframe, meta] of previewFrameMetaRef.current.entries()) {
      applyPreviewSelectionToFrame(iframe, meta.nodeId);
    }
  }, [selectedTagCid, selectedNode?.id, nodes]);

  useEffect(() => {
    if (editMode) return;
    setDragTagCid(null);
    setTagDropHint(null);
  }, [editMode]);

  useEffect(() => {
    if (!editMode) return;
    if (!selectedNode) return;
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const frame = requestAnimationFrame(() => {
      editor.refresh?.();
      fitEditorCanvasToNode(editor, selectedNode);
      rebuildTagTree();
    });
    return () => cancelAnimationFrame(frame);
  }, [editMode, selectedNode?.id, nodes]);

  useEffect(() => {
    if (!editMode || !selectedNode) return;
    const editor = grapesEditorRef.current;
    if (!editor) return;

    const fit = () => fitEditorCanvasToNode(editor, selectedNode);
    const frame = requestAnimationFrame(fit);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", fit);
    };
  }, [editMode, selectedNode?.id, selectedNode?.w, selectedNode?.h]);

  useEffect(() => {
    if (editMode) return;
    if (selectedTargets.length === 0) return;

    const frame = requestAnimationFrame(() => {
      moveableRef.current?.updateRect();
    });

    return () => cancelAnimationFrame(frame);
  }, [editMode, boardZoom, selectedTargets, nodes]);

  const updateNode = (id: string, patch: Partial<HtmlCssNode>) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    );
  };

  const applyPagePreset = (presetKey: string) => {
    if (!selectedNode) return;
    const preset = PAGE_PRESETS.find((item) => item.key === presetKey);
    if (!preset) return;
    updateNode(selectedNode.id, { w: preset.w, h: preset.h });
  };

  const swapPageOrientation = () => {
    if (!selectedNode) return;
    updateNode(selectedNode.id, {
      w: Math.max(0, Math.round(selectedNode.h)),
      h: Math.max(0, Math.round(selectedNode.w)),
    });
  };

  const addPage = () => {
    const next = createDefaultNode(nodes.length + 1);

    setNodes((prev) => [...prev, next]);
    setSelectedIds([next.id]);
    toast.success("Page added");
  };

  function deleteSelected() {
    if (selectedIds.length === 0) return;

    setNodes((prev) => prev.filter((node) => !selectedIds.includes(node.id)));
    setSelectedIds([]);
    setEditMode(false);
    toast.success("Page removed");
  }

  function undoBoard() {
    const previous = undoStackRef.current.pop();
    if (!previous) return;

    redoStackRef.current.push(cloneNodes(nodes));
    skipHistoryRef.current = true;
    const next = cloneNodes(previous);
    setNodes(next);
    setSelectedIds((prevSelected) => {
      const kept = prevSelected.filter((id) =>
        next.some((node) => node.id === id),
      );
      if (kept.length > 0) return kept;
      return next[0] ? [next[0].id] : [];
    });
  }

  function redoBoard() {
    const nextState = redoStackRef.current.pop();
    if (!nextState) return;

    undoStackRef.current.push(cloneNodes(nodes));
    skipHistoryRef.current = true;
    const next = cloneNodes(nextState);
    setNodes(next);
    setSelectedIds((prevSelected) => {
      const kept = prevSelected.filter((id) =>
        next.some((node) => node.id === id),
      );
      if (kept.length > 0) return kept;
      return next[0] ? [next[0].id] : [];
    });
  }

  const exportSelected = async () => {
    if (!selectedNode) {
      toast.error("Select a page first");
      return;
    }

    const output = `<!-- ${selectedNode.name} -->\n<style>\n${selectedNode.css}\n</style>\n${selectedNode.html}`;

    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied HTML + CSS");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleDrag = (id: string, event: any) => {
    const [x, y] = event.beforeTranslate as [number, number];
    updateNode(id, { x, y });
  };

  const handleResize = (id: string, event: any) => {
    const [x, y] = event.drag.beforeTranslate as [number, number];
    const width = Math.max(0, Math.round(event.width));
    const height = Math.max(0, Math.round(event.height));
    updateNode(id, { x, y, w: width, h: height });
  };

  const addTagToSelectedComponent = () => {
    const editor = grapesEditorRef.current;
    if (!editor || !selectedNode) {
      toast.error("Select a page and wait for editor");
      return;
    }

    try {
      const template = getTagTemplate(importTag);
      const wrapper = editor.getWrapper?.();
      if (!wrapper) {
        toast.error("Editor root is not ready");
        return;
      }

      const selected = editor.getSelected?.();
      const selectedType = String(selected?.get?.("type") ?? "")
        .toLowerCase()
        .trim();
      const canAppendToSelected =
        Boolean(selected?.append) && selectedType !== "textnode";
      const parent = importAsChild && canAppendToSelected ? selected : wrapper;

      let added: any = null;
      if (parent?.append) {
        added = parent.append(template);
      } else {
        added = editor.addComponents(template);
      }

      const nextSelection = getLastComponentFromInsertResult(added);
      if (nextSelection) {
        editor.select(nextSelection);
        const tagName = String(
          nextSelection.get?.("tagName") ?? importTag,
        ).toLowerCase();
        setSelectedHtmlTag(tagName);
        setSelectedTagCid(String(nextSelection?.cid ?? ""));
        setStyleDraft(readStyleDraft(nextSelection));
        setSelectedTagText(readComponentText(nextSelection));
      } else {
        editor.select(parent);
      }

      syncActiveNodeFromEditor(editor);
      rebuildTagTree();
      toast.success(`Imported <${importTag}>`);
    } catch (error) {
      toast.error("Tag import failed");
      console.error("addTagToSelectedComponent failed", error);
    }
  };

  const importHtmlSnippetToComponent = () => {
    const editor = grapesEditorRef.current;
    if (!editor || !selectedNode) {
      toast.error("Select a page and wait for editor");
      return;
    }

    const snippet = importSnippet.trim();
    if (!snippet) {
      toast.error("Enter HTML snippet first");
      return;
    }

    try {
      const wrapper = editor.getWrapper?.();
      if (!wrapper) {
        toast.error("Editor root is not ready");
        return;
      }

      const selected = editor.getSelected?.();
      const selectedType = String(selected?.get?.("type") ?? "")
        .toLowerCase()
        .trim();
      const canAppendToSelected =
        Boolean(selected?.append) && selectedType !== "textnode";
      const parent = importAsChild && canAppendToSelected ? selected : wrapper;

      let added: any = null;
      if (parent?.append) {
        added = parent.append(snippet);
      } else {
        added = editor.addComponents(snippet);
      }

      const nextSelection = getLastComponentFromInsertResult(added);
      if (nextSelection) {
        editor.select(nextSelection);
        setSelectedTagCid(String(nextSelection?.cid ?? ""));
        setSelectedHtmlTag(
          String(nextSelection?.get?.("tagName") ?? "(none)").toLowerCase(),
        );
        setStyleDraft(readStyleDraft(nextSelection));
        setSelectedTagText(readComponentText(nextSelection));
      }

      syncActiveNodeFromEditor(editor);
      rebuildTagTree();
      toast.success("HTML snippet imported");
    } catch (error) {
      toast.error("HTML snippet import failed");
      console.error("importHtmlSnippetToComponent failed", error);
    }
  };

  const selectRootTag = () => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;
    editor.select(wrapper);
    setSelectedHtmlTag(
      String(wrapper.get?.("tagName") ?? "body").toLowerCase(),
    );
    setSelectedTagCid(String(wrapper.cid ?? ""));
    setStyleDraft(readStyleDraft(wrapper));
    setSelectedTagText(readComponentText(wrapper));
  };

  const clearTagSelection = () => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    editor.select(null);
    setSelectedHtmlTag("(none)");
    setSelectedTagCid(null);
    setStyleDraft(createEmptyStyleDraft());
    setSelectedTagText("");
  };

  const selectTagByCid = (cid: string) => {
    const editor = grapesEditorRef.current;
    if (!editor) return;

    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;

    const component = findComponentByCid(wrapper, cid);
    if (!component) return;

    editor.select(component);
    setSelectedTagCid(cid);
    setSelectedHtmlTag(
      String(component.get?.("tagName") ?? "(none)").toLowerCase(),
    );
    setStyleDraft(readStyleDraft(component));
    setSelectedTagText(readComponentText(component));
  };

  const refreshSelectedTagState = (editor: any, component: any) => {
    editor.select(component);
    setSelectedTagCid(String(component?.cid ?? ""));
    setSelectedHtmlTag(
      String(component?.get?.("tagName") ?? "(none)").toLowerCase(),
    );
    setStyleDraft(readStyleDraft(component));
    setSelectedTagText(readComponentText(component));
    syncActiveNodeFromEditor(editor);
    rebuildTagTree();
  };

  const resolveTagDropPlacement = (
    event: DragEvent<HTMLButtonElement>,
  ): TagDropPlacement => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio =
      rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5;
    if (ratio < 0.25) return "before";
    if (ratio > 0.75) return "after";
    return "inside";
  };

  const clearTagDragState = () => {
    setDragTagCid(null);
    setTagDropHint(null);
  };

  const moveTagByDrop = (
    sourceCid: string,
    targetCid: string,
    placement: TagDropPlacement,
  ) => {
    const editor = grapesEditorRef.current;
    if (!editor) {
      toast.error("Editor is still loading");
      return;
    }

    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;

    const source = findComponentByCid(wrapper, sourceCid);
    const target = findComponentByCid(wrapper, targetCid);
    if (!source || !target) return;

    if (String(source.cid) === String(target.cid)) return;
    if (componentTreeContainsCid(source, targetCid)) {
      toast.error("Cannot move a tag into its own child");
      return;
    }

    const sourceParent = source.parent?.();
    if (!sourceParent) {
      toast.error("Cannot move root tag");
      return;
    }

    if (placement === "inside") {
      const targetType = String(target?.get?.("type") ?? "").toLowerCase();
      if (targetType === "textnode" || !target?.append) {
        toast.error("Cannot move into that tag");
        return;
      }
      const sourceCollection = sourceParent.components?.();
      if (!sourceCollection?.remove) return;
      sourceCollection.remove(source, { silent: true });
      target.append(source);
      refreshSelectedTagState(editor, source);
      return;
    }

    const targetParent = target.parent?.();
    const sourceCollection = sourceParent.components?.();
    if (!sourceCollection?.remove) return;

    if (!targetParent) {
      sourceCollection.remove(source, { silent: true });
      wrapper.append(source);
      refreshSelectedTagState(editor, source);
      return;
    }

    const targetCollection = targetParent.components?.();
    if (!targetCollection?.add) {
      toast.error("Cannot move tag there");
      return;
    }

    const siblings = getComponentChildren(targetParent);
    const targetIndex = siblings.findIndex(
      (item) => String(item?.cid) === String(target.cid),
    );
    const insertAt =
      targetIndex < 0
        ? siblings.length
        : placement === "before"
          ? targetIndex
          : targetIndex + 1;

    sourceCollection.remove(source, { silent: true });
    targetCollection.add(source, { at: insertAt });
    refreshSelectedTagState(editor, source);
  };

  const moveSelectedTagBy = (delta: number) => {
    const editor = grapesEditorRef.current;
    if (!editor) {
      toast.error("Editor is still loading");
      return;
    }

    const selected = editor.getSelected?.();
    if (!selected) {
      toast.error("Select a tag first");
      return;
    }

    const parent = selected.parent?.();
    if (!parent) {
      toast.error("Cannot move root tag");
      return;
    }

    const siblings = getComponentChildren(parent);
    const currentIndex = siblings.findIndex(
      (item) => String(item?.cid) === String(selected?.cid),
    );
    if (currentIndex < 0) return;

    const nextIndex = Math.max(
      0,
      Math.min(siblings.length - 1, currentIndex + delta),
    );
    if (nextIndex === currentIndex) return;

    const parentComponents = parent.components?.();
    if (!parentComponents?.remove || !parentComponents?.add) return;

    parentComponents.remove(selected, { silent: true });
    parentComponents.add(selected, { at: nextIndex });
    refreshSelectedTagState(editor, selected);
  };

  const nestSelectedTagIntoPreviousSibling = () => {
    const editor = grapesEditorRef.current;
    if (!editor) {
      toast.error("Editor is still loading");
      return;
    }

    const selected = editor.getSelected?.();
    if (!selected) {
      toast.error("Select a tag first");
      return;
    }

    const parent = selected.parent?.();
    if (!parent) {
      toast.error("Cannot move root tag");
      return;
    }

    const siblings = getComponentChildren(parent);
    const currentIndex = siblings.findIndex(
      (item) => String(item?.cid) === String(selected?.cid),
    );
    if (currentIndex <= 0) {
      toast.error("No previous sibling to nest into");
      return;
    }

    const target = siblings[currentIndex - 1];
    const targetType = String(target?.get?.("type") ?? "").toLowerCase();
    if (targetType === "textnode") {
      toast.error("Cannot nest into a text node");
      return;
    }

    const parentComponents = parent.components?.();
    if (!parentComponents?.remove || !target?.append) return;

    parentComponents.remove(selected, { silent: true });
    target.append(selected);
    refreshSelectedTagState(editor, selected);
  };

  const outdentSelectedTag = () => {
    const editor = grapesEditorRef.current;
    if (!editor) {
      toast.error("Editor is still loading");
      return;
    }

    const selected = editor.getSelected?.();
    if (!selected) {
      toast.error("Select a tag first");
      return;
    }

    const parent = selected.parent?.();
    const grandParent = parent?.parent?.();
    if (!parent || !grandParent) {
      toast.error("Tag is already at top level");
      return;
    }

    const parentComponents = parent.components?.();
    const grandComponents = grandParent.components?.();
    if (!parentComponents?.remove || !grandComponents?.add) return;

    const grandSiblings = getComponentChildren(grandParent);
    const parentIndex = grandSiblings.findIndex(
      (item) => String(item?.cid) === String(parent?.cid),
    );
    const insertAt = parentIndex >= 0 ? parentIndex + 1 : grandSiblings.length;

    parentComponents.remove(selected, { silent: true });
    grandComponents.add(selected, { at: insertAt });
    refreshSelectedTagState(editor, selected);
  };

  const moveSelectedTagIntoTarget = () => {
    const editor = grapesEditorRef.current;
    if (!editor) {
      toast.error("Editor is still loading");
      return;
    }

    const selected = editor.getSelected?.();
    if (!selected) {
      toast.error("Select a tag first");
      return;
    }

    if (!moveTargetCid) {
      toast.error("Choose a target tag first");
      return;
    }

    if (String(selected?.cid) === moveTargetCid) {
      toast.error("Cannot move a tag into itself");
      return;
    }

    if (componentTreeContainsCid(selected, moveTargetCid)) {
      toast.error("Cannot move a tag into its own child");
      return;
    }

    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;

    const target = findComponentByCid(wrapper, moveTargetCid);
    if (!target) {
      toast.error("Target tag not found");
      return;
    }

    const targetType = String(target?.get?.("type") ?? "").toLowerCase();
    if (targetType === "textnode") {
      toast.error("Cannot move into a text node");
      return;
    }

    const currentParent = selected.parent?.();
    if (!currentParent) {
      toast.error("Cannot move root tag");
      return;
    }

    const currentComponents = currentParent.components?.();
    if (!currentComponents?.remove || !target?.append) return;

    currentComponents.remove(selected, { silent: true });
    target.append(selected);
    refreshSelectedTagState(editor, selected);
  };

  const applyStyleValue = (key: string, value: string) => {
    setStyleDraft((prev) => ({ ...prev, [key]: value }));

    const editor = grapesEditorRef.current;
    if (!editor) return;
    const selected = editor.getSelected?.();
    if (!selected) return;

    const nextStyle = {
      ...((selected.getStyle?.() ?? {}) as Record<string, string>),
    };

    if (value.trim() === "") {
      delete nextStyle[key];
    } else {
      nextStyle[key] = value;
    }

    selected.setStyle(nextStyle);
    syncActiveNodeFromEditor(editor);
    rebuildTagTree();
  };

  const applySelectedTagText = (value: string) => {
    setSelectedTagText(value);

    const editor = grapesEditorRef.current;
    if (!editor) return;
    const selected = editor.getSelected?.();
    if (!selected) return;

    const selectedType = String(selected?.get?.("type") ?? "")
      .toLowerCase()
      .trim();
    if (selectedType === "textnode" || selectedType === "text") {
      selected.set?.("content", value);
      syncActiveNodeFromEditor(editor);
      rebuildTagTree();
      return;
    }

    const children = getComponentChildren(selected);
    const textChild = children.find((child) => {
      const type = String(child?.get?.("type") ?? "")
        .toLowerCase()
        .trim();
      return type === "textnode" || type === "text";
    });

    if (textChild) {
      textChild.set?.("content", value);
    } else if (selected.append) {
      selected.append(value);
    } else {
      selected.set?.("content", value);
    }

    syncActiveNodeFromEditor(editor);
    rebuildTagTree();
  };

  const renderTagTree = (items: TagTreeNode[], depth = 0): ReactNode[] => {
    return items.flatMap((item) => {
      const isActive = selectedTagCid === item.cid;
      const isDropTarget = tagDropHint?.targetCid === item.cid;
      const dropPlacement = isDropTarget ? tagDropHint?.placement : null;
      const dropClass = isDropTarget
        ? dropPlacement === "inside"
          ? "bg-emerald-500/10 ring-1 ring-emerald-500/40"
          : dropPlacement === "before"
            ? "border-t border-emerald-400"
            : "border-b border-emerald-400"
        : "";
      const row = (
        <li key={item.cid}>
          <button
            onClick={() => selectTagByCid(item.cid)}
            draggable
            onDragStart={(event) => {
              setDragTagCid(item.cid);
              event.dataTransfer.setData("text/plain", item.cid);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
              const sourceCid =
                dragTagCid || event.dataTransfer.getData("text/plain");
              if (!sourceCid || sourceCid === item.cid) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              const placement = resolveTagDropPlacement(event);
              setTagDropHint({ targetCid: item.cid, placement });
            }}
            onDrop={(event) => {
              const sourceCid =
                dragTagCid || event.dataTransfer.getData("text/plain");
              if (!sourceCid || sourceCid === item.cid) {
                clearTagDragState();
                return;
              }
              event.preventDefault();
              const placement = resolveTagDropPlacement(event);
              moveTagByDrop(sourceCid, item.cid, placement);
              clearTagDragState();
            }}
            onDragEnd={clearTagDragState}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              isActive
                ? "bg-brand-500/10 text-brand-400 font-medium"
                : "hover:bg-surface text-gray-300 hover:text-white"
            } ${dropClass}`}
            style={{ paddingLeft: 8 + depth * 14 }}
          >
            <Icon icon="mdi:code-tags" className="text-sm opacity-70" />
            <span className="truncate">
              {item.tagName.startsWith("#")
                ? item.tagName
                : `<${item.tagName}>`}
            </span>
          </button>
        </li>
      );

      if (item.children.length === 0) return [row];
      return [row, ...renderTagTree(item.children, depth + 1)];
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-border flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}`}
            className="hover:bg-surface flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
            aria-label="Back to project"
          >
            <Icon icon="mdi:arrow-left" className="text-lg" />
          </Link>
          <div className="bg-border h-4 w-px" />
          <h2 className="text-sm font-medium text-white">{roomName}</h2>
        </div>

        <div className="flex items-center gap-2">
          {selectedNode && (
            <div className="border-border/70 bg-surface/70 flex items-center gap-1 rounded-lg border px-1.5 py-1">
              <Icon icon="mdi:responsive" className="text-sm text-gray-400" />
              <select
                defaultValue=""
                onChange={(event) => {
                  applyPagePreset(event.target.value);
                  event.currentTarget.value = "";
                }}
                className="hover:bg-surface focus:bg-surface max-w-[140px] rounded bg-transparent px-1 py-0.5 text-xs text-gray-200 outline-none"
                aria-label="Apply page size preset"
              >
                <option value="" disabled>
                  Viewport
                </option>
                {PAGE_PRESETS.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <div className="bg-border/80 mx-1 h-4 w-px" />
              <input
                type="number"
                value={Math.round(selectedNode.w)}
                min={0}
                onChange={(event) =>
                  updateNode(selectedNode.id, {
                    w: Math.max(0, Number(event.target.value)),
                  })
                }
                className="focus:bg-surface w-16 rounded bg-transparent px-1 py-0.5 text-xs text-gray-200 outline-none"
                aria-label="Viewport width"
              />
              <span className="text-xs text-gray-500">x</span>
              <input
                type="number"
                value={Math.round(selectedNode.h)}
                min={0}
                onChange={(event) =>
                  updateNode(selectedNode.id, {
                    h: Math.max(0, Number(event.target.value)),
                  })
                }
                className="focus:bg-surface w-16 rounded bg-transparent px-1 py-0.5 text-xs text-gray-200 outline-none"
                aria-label="Viewport height"
              />
              <button
                onClick={swapPageOrientation}
                className="hover:bg-surface ml-0.5 flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-white"
                aria-label="Swap viewport orientation"
              >
                <Icon icon="mdi:phone-rotate-landscape" className="text-sm" />
              </button>
              <div className="bg-border/80 mx-1 h-4 w-px" />
              <Icon
                icon="mdi:drag-horizontal-variant"
                className="text-sm text-gray-400"
              />
              <input
                type="range"
                min={320}
                max={Math.max(3840, Math.round(selectedNode.w) + 200)}
                step={1}
                value={Math.round(selectedNode.w)}
                onChange={(event) =>
                  updateNode(selectedNode.id, {
                    w: Math.max(0, Number(event.target.value)),
                  })
                }
                className="accent-brand-500 w-24"
                aria-label="Viewport width resizer"
              />
              {editMode && (
                <span className="min-w-[58px] text-right text-[11px] text-gray-400">
                  Fit {editFitPercent}%
                </span>
              )}
            </div>
          )}

          <div className="bg-surface/60 flex items-center gap-1.5 rounded-lg px-2.5 py-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400">{onlineCount} online</span>
          </div>

          {!editMode && (
            <div className="bg-surface/60 ml-1 flex items-center gap-1 rounded-lg p-1">
              <button
                onClick={zoomOut}
                className="hover:bg-surface flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-white"
                aria-label="Zoom out"
              >
                <Icon icon="mdi:minus" className="text-sm" />
              </button>
              <button
                onClick={resetZoom}
                className="hover:bg-surface min-w-[52px] rounded px-1.5 py-0.5 text-center text-xs text-gray-300 transition-colors hover:text-white"
                aria-label="Reset zoom"
              >
                {Math.round(boardZoom * 100)}%
              </button>
              <button
                onClick={zoomIn}
                className="hover:bg-surface flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-white"
                aria-label="Zoom in"
              >
                <Icon icon="mdi:plus" className="text-sm" />
              </button>
            </div>
          )}

          <button
            onClick={() => setShowInvite(true)}
            className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:share-variant" className="text-sm" />
            Share
          </button>

          <button
            onClick={() => setEditMode((prev) => !prev)}
            disabled={!selectedNode}
            className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon
              icon={
                editMode
                  ? "mdi:view-dashboard-outline"
                  : "mdi:file-document-edit-outline"
              }
              className="text-sm"
            />
            {editMode ? "Board Mode" : "Edit Mode"}
          </button>

          <div className="bg-border mx-1 h-4 w-px" />

          <button
            onClick={addPage}
            className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:plus-box-outline" className="text-sm" />
            Add Page
          </button>
          <button
            onClick={exportSelected}
            className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:code-braces-box" className="text-sm" />
            Export
          </button>
          <button
            onClick={deleteSelected}
            className="hover:bg-surface flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
            aria-label="Delete selected component"
          >
            <Icon icon="mdi:trash-can-outline" className="text-lg" />
          </button>

          <button
            onClick={() => setLayersOpen((prev) => !prev)}
            aria-label="Toggle layers"
            className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
              layersOpen
                ? "bg-brand-500/10 text-brand-400"
                : "hover:bg-surface text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon icon="mdi:layers-outline" className="text-lg" />
          </button>
          <button
            onClick={() => setPropertiesOpen((prev) => !prev)}
            aria-label="Toggle properties"
            className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
              propertiesOpen
                ? "bg-brand-500/10 text-brand-400"
                : "hover:bg-surface text-gray-500 hover:text-gray-300"
            }`}
          >
            <Icon icon="mdi:tune-variant" className="text-lg" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {layersOpen && (
          <aside className="scrollbar-thin border-border bg-secondary flex w-64 flex-col border-r">
            <div className="border-border flex items-center justify-between border-b px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase">
                Layers
              </h3>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-2">
              <section>
                <p className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                  Pages
                </p>
                {nodes.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-gray-500">
                    No pages yet
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {nodes.map((node) => {
                      const isSelected = selectedIds.includes(node.id);
                      return (
                        <li key={node.id}>
                          <button
                            onClick={() => setSelectedIds([node.id])}
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                              isSelected
                                ? "bg-brand-500/10 text-brand-400 font-medium"
                                : "hover:bg-surface text-gray-300 hover:text-white"
                            }`}
                          >
                            <Icon
                              icon="mdi:file-code-outline"
                              className="text-sm opacity-70"
                            />
                            <span className="truncate">{node.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="border-border/60 border-t pt-3">
                <p className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                  Tag Layers
                </p>
                {!selectedNode ? (
                  <p className="px-2 py-2 text-xs text-gray-500">
                    Select a page to inspect tags.
                  </p>
                ) : tagTree.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-gray-500">
                    No tags yet. Import/select tags from the Design panel.
                  </p>
                ) : (
                  <ul className="space-y-0.5">{renderTagTree(tagTree)}</ul>
                )}
              </section>
            </div>
          </aside>
        )}

        <main
          className={`relative flex-1 overflow-hidden ${
            editMode ? "bg-[#0d1220]" : "bg-[#121212]"
          }`}
          style={
            editMode
              ? undefined
              : {
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0)",
                  backgroundSize: "28px 28px",
                }
          }
        >
          <div
            className={editMode ? "hidden" : "relative z-0 block h-full w-full"}
          >
            <InfiniteViewer
              ref={viewerRef}
              className={`h-full w-full ${isSpacePressed ? "cursor-grab active:cursor-grabbing" : ""}`}
              useMouseDrag={isSpacePressed && !isTransforming}
              useWheelScroll
              zoom={boardZoom}
              zoomRange={[0.1, 4]}
              onScroll={() => {
                moveableRef.current?.updateRect();
              }}
            >
              <div
                ref={boardRef}
                className="relative"
                style={{
                  width: BOARD_WIDTH,
                  height: BOARD_HEIGHT,
                }}
                onMouseDown={(event) => {
                  const target = event.target as HTMLElement;
                  if (!target.closest(".html-css-node")) {
                    setSelectedIds([]);
                  }
                }}
              >
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    data-node-id={node.id}
                    onMouseDown={(event) => {
                      if (isSpacePressed) return;
                      event.stopPropagation();
                      setSelectedIds([node.id]);
                    }}
                    className={`html-css-node absolute cursor-pointer ${
                      selectedIds.includes(node.id)
                        ? "ring-brand-400 ring-2 ring-offset-1 ring-offset-[#121212]"
                        : ""
                    } ${isSpacePressed ? "pointer-events-none" : ""}`}
                    style={{
                      width: node.w,
                      height: node.h,
                      transform: `translate(${node.x}px, ${node.y}px)`,
                    }}
                  >
                    <div className="border-border h-full w-full overflow-hidden rounded-md border bg-white shadow-md">
                      <iframe
                        title={node.name}
                        className="h-full w-full border-0"
                        sandbox="allow-same-origin"
                        srcDoc={buildSrcDoc(node)}
                        onLoad={(event) =>
                          bindPreviewFrame(
                            event.currentTarget,
                            node.id,
                            "board",
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </InfiniteViewer>

            <Moveable
              ref={moveableRef}
              target={isSpacePressed ? [] : selectedTargets}
              draggable={!isSpacePressed}
              resizable={!isSpacePressed}
              zoom={boardZoom}
              snappable
              keepRatio={false}
              origin={false}
              throttleDrag={0}
              throttleResize={0}
              onDragStart={() => setIsTransforming(true)}
              onDrag={(event) => {
                const target = event.target as HTMLElement;
                const id = target.dataset.nodeId;
                if (!id) return;
                handleDrag(id, event);
              }}
              onDragEnd={() => setIsTransforming(false)}
              onDragGroupStart={() => setIsTransforming(true)}
              onDragGroup={(event) => {
                for (const dragEvent of event.events) {
                  const id = (dragEvent.target as HTMLElement).dataset.nodeId;
                  if (!id) continue;
                  handleDrag(id, dragEvent);
                }
              }}
              onDragGroupEnd={() => setIsTransforming(false)}
              onResizeStart={() => setIsTransforming(true)}
              onResize={(event) => {
                const id = (event.target as HTMLElement).dataset.nodeId;
                if (!id) return;
                handleResize(id, event);
              }}
              onResizeEnd={() => setIsTransforming(false)}
              onResizeGroupStart={() => setIsTransforming(true)}
              onResizeGroup={(event) => {
                for (const resizeEvent of event.events) {
                  const id = (resizeEvent.target as HTMLElement).dataset.nodeId;
                  if (!id) continue;
                  handleResize(id, resizeEvent);
                }
              }}
              onResizeGroupEnd={() => setIsTransforming(false)}
            />
          </div>

          <div
            className={`absolute inset-0 ${
              editMode ? "z-10" : "pointer-events-none -z-10 opacity-0"
            }`}
          >
            <div className="html-css-edit-root relative h-full w-full overflow-hidden [&_.gjs-pn-panels]:hidden">
              <div
                ref={grapesCanvasRef}
                className={`h-full w-full ${
                  selectedNode ? "" : "pointer-events-none opacity-0"
                }`}
              />
              {!selectedNode && (
                <div className="border-border bg-secondary absolute inset-0 flex items-center justify-center rounded-lg border text-xs text-gray-400">
                  Select a page to load the editor.
                </div>
              )}
            </div>
          </div>
        </main>

        {propertiesOpen && (
          <aside className="border-border bg-secondary flex h-full w-96 flex-col border-l">
            <div className="border-border border-b px-4 py-3">
              <h3 className="text-sm font-medium text-white">Design</h3>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {!selectedNode ? (
                <div className="border-border rounded border p-3 text-xs text-gray-500">
                  Select one page to edit.
                </div>
              ) : (
                <>
                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Page
                    </h4>
                    <input
                      value={selectedNode.name}
                      onChange={(event) =>
                        updateNode(selectedNode.id, {
                          name: event.target.value,
                        })
                      }
                      className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                      placeholder="Page name"
                    />
                  </section>

                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Frame
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={Math.round(selectedNode.w)}
                        onChange={(event) =>
                          updateNode(selectedNode.id, {
                            w: Math.max(0, Number(event.target.value)),
                          })
                        }
                        className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                        placeholder="width"
                      />
                      <input
                        type="number"
                        value={Math.round(selectedNode.h)}
                        onChange={(event) =>
                          updateNode(selectedNode.id, {
                            h: Math.max(0, Number(event.target.value)),
                          })
                        }
                        className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                        placeholder="height"
                      />
                    </div>
                  </section>

                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Import HTML Tag
                    </h4>
                    <div className="space-y-2">
                      <select
                        value={importTag}
                        onChange={(event) => setImportTag(event.target.value)}
                        className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-2 text-xs text-white outline-none focus:ring-1"
                      >
                        {TAG_OPTIONS.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>

                      <label className="flex items-center gap-2 text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={importAsChild}
                          onChange={(event) =>
                            setImportAsChild(event.target.checked)
                          }
                        />
                        Add as child of selected tag
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={addTagToSelectedComponent}
                          className="bg-brand-500 hover:bg-brand-600 rounded px-3 py-2 text-xs font-medium text-white"
                        >
                          Import Tag
                        </button>
                        <button
                          onClick={selectRootTag}
                          className="bg-surface hover:bg-surface/80 rounded px-3 py-2 text-xs text-gray-300"
                        >
                          Select Root
                        </button>
                      </div>

                      <textarea
                        value={importSnippet}
                        onChange={(event) =>
                          setImportSnippet(event.target.value)
                        }
                        className="bg-surface focus:ring-brand-500 min-h-[74px] w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                        placeholder="Paste raw HTML snippet"
                      />
                      <button
                        onClick={importHtmlSnippetToComponent}
                        className="bg-surface hover:bg-surface/80 w-full rounded px-3 py-2 text-xs text-gray-200"
                      >
                        Import HTML Snippet
                      </button>
                    </div>
                  </section>

                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Tag Selection
                    </h4>
                    <div className="border-border bg-surface/40 rounded border p-2 text-xs text-gray-300">
                      Selected tag:{" "}
                      <span className="font-medium text-white">
                        {selectedHtmlTag}
                      </span>
                    </div>
                    <button
                      onClick={clearTagSelection}
                      className="bg-surface hover:bg-surface/80 mt-2 w-full rounded px-3 py-2 text-xs text-gray-300"
                    >
                      Deselect Tag
                    </button>
                  </section>

                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Text Content
                    </h4>
                    <textarea
                      value={selectedTagText}
                      onChange={(event) =>
                        applySelectedTagText(event.target.value)
                      }
                      disabled={!selectedTagCid}
                      className="bg-surface focus:ring-brand-500 min-h-[74px] w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-40"
                      placeholder="Type text for selected tag"
                    />
                  </section>

                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Tag Structure
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => moveSelectedTagBy(-1)}
                        disabled={!selectedTagCid}
                        className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move Up
                      </button>
                      <button
                        onClick={() => moveSelectedTagBy(1)}
                        disabled={!selectedTagCid}
                        className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move Down
                      </button>
                      <button
                        onClick={nestSelectedTagIntoPreviousSibling}
                        disabled={!selectedTagCid}
                        className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Nest In
                      </button>
                      <button
                        onClick={outdentSelectedTag}
                        disabled={!selectedTagCid}
                        className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Outdent
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <select
                        value={moveTargetCid}
                        onChange={(event) =>
                          setMoveTargetCid(event.target.value)
                        }
                        className="bg-surface focus:ring-brand-500 col-span-1 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                      >
                        <option value="">Move into...</option>
                        {moveTargetOptions.map((option) => (
                          <option key={option.cid} value={option.cid}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={moveSelectedTagIntoTarget}
                        disabled={!selectedTagCid || !moveTargetCid}
                        className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move As Child
                      </button>
                    </div>
                  </section>

                  <section>
                    <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Styles
                    </h4>
                    <div className="space-y-3">
                      {STYLE_GROUPS.map((group) => (
                        <div key={group.title}>
                          <p className="mb-2 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                            {group.title}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {group.keys.map((key) => {
                              const options = STYLE_SELECT_OPTIONS[key];
                              const value = styleDraft[key] ?? "";
                              return (
                                <div key={key} className="col-span-1">
                                  <label className="mb-1 block text-[11px] text-gray-400">
                                    {labelFromStyleKey(key)}
                                  </label>
                                  {options ? (
                                    <select
                                      value={value}
                                      onChange={(event) =>
                                        applyStyleValue(key, event.target.value)
                                      }
                                      className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                                    >
                                      {options.map((option) => (
                                        <option
                                          key={option || "__empty"}
                                          value={option}
                                        >
                                          {option || "(unset)"}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      value={value}
                                      onChange={(event) =>
                                        applyStyleValue(key, event.target.value)
                                      }
                                      className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                                      placeholder="e.g. 100%, 16px, 1rem"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {showInvite && (
        <InviteModal
          projectId={projectId}
          projectName={roomName}
          onClose={() => setShowInvite(false)}
        />
      )}

      <style jsx global>{`
        .html-css-edit-root,
        .html-css-edit-root .gjs-editor,
        .html-css-edit-root .gjs-cv-canvas,
        .html-css-edit-root .gjs-cv-canvas__frames {
          width: 100% !important;
          height: 100% !important;
          min-height: 0 !important;
        }

        .html-css-edit-root .gjs-editor,
        .html-css-edit-root .gjs-one-bg {
          background: transparent !important;
        }

        .html-css-edit-root .gjs-editor {
          position: relative !important;
        }

        .html-css-edit-root .gjs-cv-canvas {
          position: absolute !important;
          right: 0 !important;
          bottom: 0 !important;
          top: 0 !important;
          left: 0 !important;
          background: #0d1220 !important;
        }

        .html-css-edit-root .gjs-cv-canvas__frames {
          position: relative !important;
          display: flex !important;
          justify-content: flex-start !important;
          align-items: flex-start !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          padding: 0 !important;
        }

        .html-css-edit-root .gjs-frame-wrapper {
          position: relative !important;
          padding: 0 !important;
          margin: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        .html-css-edit-root .gjs-frame {
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .html-css-edit-root .gjs-frame > iframe {
          max-width: none !important;
          background: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
