"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildTagTreeNode,
  findComponentByDomPath,
  getComponentPathFromWrapper,
  getDomByPath,
  getDomElementPath,
  readComponentText,
  readStyleDraft,
} from "./tagTree";
import type { HtmlCssNode, StyleDraft, TagTreeNode } from "./types";
import type { BoardViewerLike, GrapesEditorLike } from "./contracts";
import { createEmptyStyleDraft, normalizeHtmlFragment } from "./utils";

type UseGrapesLifecycleArgs = {
  editMode: boolean;
  selectedNode: HtmlCssNode | null;
  nodes: HtmlCssNode[];
  selectedTagCid: string | null;
  setNodes: React.Dispatch<React.SetStateAction<HtmlCssNode[]>>;
  onSetSelectedIds: (ids: string[]) => void;
  setTagTree: React.Dispatch<React.SetStateAction<TagTreeNode[]>>;
  setSelectedTagCid: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedHtmlTag: React.Dispatch<React.SetStateAction<string>>;
  setStyleDraft: React.Dispatch<React.SetStateAction<StyleDraft>>;
  setSelectedTagText: React.Dispatch<React.SetStateAction<string>>;
  viewerRef: React.RefObject<BoardViewerLike | null>;
  getViewerZoom: () => number;
  setViewerZoomSmooth: (
    nextZoom: number,
    zoomOffset?: { x: number; y: number },
  ) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};

export function useGrapesLifecycle({
  editMode,
  selectedNode,
  nodes,
  selectedTagCid,
  setNodes,
  onSetSelectedIds,
  setTagTree,
  setSelectedTagCid,
  setSelectedHtmlTag,
  setStyleDraft,
  setSelectedTagText,
  viewerRef,
  getViewerZoom,
  setViewerZoomSmooth,
  zoomIn,
  zoomOut,
  resetZoom,
}: UseGrapesLifecycleArgs) {
  const [editFitPercent, setEditFitPercent] = useState(100);
  const [isGrapesReady, setIsGrapesReady] = useState(false);

  const grapesCanvasRef = useRef<HTMLDivElement | null>(null);
  const grapesEditorRef = useRef<GrapesEditorLike | null>(null);
  const grapesSyncingRef = useRef(false);
  const activeNodeIdRef = useRef<string | null>(null);
  const previewFrameCleanupRef = useRef<Map<HTMLIFrameElement, () => void>>(
    new Map(),
  );
  const previewFrameMetaRef = useRef<Map<HTMLIFrameElement, string>>(new Map());
  const pendingPreviewPathRef = useRef<{
    nodeId: string;
    path: number[];
  } | null>(null);

  const syncActiveNodeFromEditor = (editor: GrapesEditorLike | null) => {
    const nodeId = activeNodeIdRef.current ?? selectedNode?.id ?? null;
    if (!nodeId) return;

    const html = normalizeHtmlFragment(editor?.getHtml?.() ?? "");
    const css = editor?.getCss?.() || "";
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, html, css } : node)),
    );
  };

  const fitEditorCanvasToNode = (
    editor: GrapesEditorLike | null,
    node: HtmlCssNode | null,
  ) => {
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

      onSetSelectedIds([nodeId]);

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

      const wheelContainer = viewerRef.current?.getContainer?.() as
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

    previewFrameMetaRef.current.set(iframe, nodeId);
    applyPreviewSelectionToFrame(iframe, nodeId);

    previewFrameCleanupRef.current.set(iframe, () => {
      doc.removeEventListener("mousedown", handleMouseDown, true);
      doc.removeEventListener("wheel", handleWheel as EventListener);
      doc.removeEventListener("keydown", handleKeyDown, true);
      previewFrameMetaRef.current.delete(iframe);
    });
  };

  useEffect(() => {
    if (grapesEditorRef.current || !grapesCanvasRef.current || !selectedNode)
      return;

    setIsGrapesReady(false);
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
        setIsGrapesReady(true);
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
      setIsGrapesReady(false);
    };
  }, []);

  useEffect(() => {
    if (!grapesEditorRef.current) return;
    const editor = grapesEditorRef.current;

    if (!selectedNode) {
      activeNodeIdRef.current = null;
      pendingPreviewPathRef.current = null;
      setIsGrapesReady(false);
      setSelectedHtmlTag("(none)");
      setSelectedTagCid(null);
      setTagTree([]);
      setStyleDraft(createEmptyStyleDraft());
      setSelectedTagText("");
      return;
    }

    activeNodeIdRef.current = selectedNode.id;
    setIsGrapesReady(false);
    grapesSyncingRef.current = true;
    editor.setComponents(normalizeHtmlFragment(selectedNode.html));
    editor.setStyle(selectedNode.css);
    grapesSyncingRef.current = false;
    requestAnimationFrame(() => {
      editor.refresh?.();
      fitEditorCanvasToNode(editor, selectedNode);
      setIsGrapesReady(true);
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
    for (const [iframe, nodeId] of previewFrameMetaRef.current.entries()) {
      applyPreviewSelectionToFrame(iframe, nodeId);
    }
  }, [selectedTagCid, selectedNode?.id]);

  useEffect(() => {
    if (!editMode || !selectedNode) return;
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const frame = requestAnimationFrame(() => {
      editor.refresh?.();
      fitEditorCanvasToNode(editor, selectedNode);
      rebuildTagTree();
    });
    return () => cancelAnimationFrame(frame);
  }, [editMode, selectedNode?.id]);

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

  return {
    grapesCanvasRef,
    grapesEditorRef,
    editFitPercent,
    isGrapesReady,
    bindPreviewFrame,
    rebuildTagTree,
    syncActiveNodeFromEditor,
  };
}
