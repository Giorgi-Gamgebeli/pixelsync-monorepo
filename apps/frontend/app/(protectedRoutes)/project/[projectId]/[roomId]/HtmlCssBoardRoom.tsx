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
import InviteModal from "../InviteModal";
import toast from "react-hot-toast";
import {
  getHtmlCssBoardPayload,
  saveHtmlCssBoardPayload,
} from "@/app/_dataAccessLayer/actions";
import { PAGE_PRESETS } from "./htmlCssBoardRoom/constants";
import BoardCanvas from "./htmlCssBoardRoom/BoardCanvas";
import DesignPanel from "./htmlCssBoardRoom/DesignPanel";
import GrapesEditorCanvas from "./htmlCssBoardRoom/GrapesEditorCanvas";
import LayersPanel from "./htmlCssBoardRoom/LayersPanel";
import RoomHeader from "./htmlCssBoardRoom/RoomHeader";
import { useBoardMode } from "./htmlCssBoardRoom/useBoardMode";
import { useGrapesLifecycle } from "./htmlCssBoardRoom/useGrapesLifecycle";
import {
  componentTreeContainsCid,
  findComponentByCid,
  getComponentChildren,
  getLastComponentFromInsertResult,
  readComponentText,
  readStyleDraft,
} from "./htmlCssBoardRoom/tagTree";
import type {
  HtmlCssBoardRoomProps,
  HtmlCssNode,
  StyleDraft,
  TagDropPlacement,
  TagTreeNode,
} from "./htmlCssBoardRoom/types";
import {
  buildSrcDoc,
  cloneNodes,
  createDefaultNode,
  createEmptyStyleDraft,
  getTagTemplate,
  isTextInputTarget,
} from "./htmlCssBoardRoom/utils";

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
  const [isReady, setIsReady] = useState(false);

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

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef("");
  const previousNodesRef = useRef<HtmlCssNode[] | null>(null);
  const undoStackRef = useRef<HtmlCssNode[][]>([]);
  const redoStackRef = useRef<HtmlCssNode[][]>([]);
  const skipHistoryRef = useRef(false);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedIds[0]) ?? null,
    [nodes, selectedIds],
  );

  const updateNode = (id: string, patch: Partial<HtmlCssNode>) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, ...patch } : node)),
    );
  };

  const {
    boardRef,
    boardViewportRef,
    viewerRef,
    moveableRef,
    selectedTargets,
    isTransforming,
    setIsTransforming,
    boardZoom,
    isSpacePressed,
    marqueeSelection,
    getViewerZoom,
    setViewerZoomSmooth,
    zoomIn,
    zoomOut,
    resetZoom,
    handleDrag,
    handleResize,
    centerNodeInViewport,
    handleBoardViewportMouseDown,
  } = useBoardMode({
    editMode,
    isReady,
    roomId,
    nodes,
    selectedIds,
    onSetSelectedIds: setSelectedIds,
    onUpdateNode: updateNode,
  });

  const {
    grapesCanvasRef,
    grapesEditorRef,
    editFitPercent,
    bindPreviewFrame,
    rebuildTagTree,
    syncActiveNodeFromEditor,
  } = useGrapesLifecycle({
    editMode,
    selectedNode,
    nodes,
    selectedTagCid,
    setNodes,
    onSetSelectedIds: setSelectedIds,
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
  });

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

  useEffect(() => {
    const load = async () => {
      const payload = await getHtmlCssBoardPayload(roomId);

      if (payload && typeof payload === "object" && "error" in payload) {
        toast.error(payload.error);
        setNodes([]);
        setSelectedIds([]);
        setIsReady(true);
        return;
      }

      const nextNodes =
        payload &&
        "nodes" in payload &&
        Array.isArray(payload.nodes) &&
        payload.nodes.length > 0
          ? payload.nodes
          : [];

      setNodes(nextNodes);
      setSelectedIds(nextNodes[0] ? [nextNodes[0].id] : []);
      setIsReady(true);
    };

    load();

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
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
    if (editMode && !selectedNode) {
      setEditMode(false);
    }
  }, [editMode, selectedNode]);

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
    if (editMode) return;
    setDragTagCid(null);
    setTagDropHint(null);
  }, [editMode]);

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
    const index = nodes.length + 1;
    const next = createDefaultNode(index);

    setNodes((prev) => [...prev, next]);
    setSelectedIds([next.id]);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        centerNodeInViewport(next.id);
      });
    });

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
      <RoomHeader
        projectId={projectId}
        roomName={roomName}
        onlineCount={onlineCount}
        selectedNode={selectedNode}
        editMode={editMode}
        editFitPercent={editFitPercent}
        boardZoom={boardZoom}
        layersOpen={layersOpen}
        propertiesOpen={propertiesOpen}
        onApplyPagePreset={applyPagePreset}
        onUpdateSelectedWidth={(value) => {
          if (!selectedNode) return;
          updateNode(selectedNode.id, { w: value });
        }}
        onUpdateSelectedHeight={(value) => {
          if (!selectedNode) return;
          updateNode(selectedNode.id, { h: value });
        }}
        onSwapPageOrientation={swapPageOrientation}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onZoomIn={zoomIn}
        onShowInvite={() => setShowInvite(true)}
        onToggleEditMode={() => setEditMode((prev) => !prev)}
        onAddPage={addPage}
        onExportSelected={exportSelected}
        onDeleteSelected={deleteSelected}
        onToggleLayersOpen={() => setLayersOpen((prev) => !prev)}
        onTogglePropertiesOpen={() => setPropertiesOpen((prev) => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        {layersOpen && (
          <LayersPanel
            nodes={nodes}
            selectedIds={selectedIds}
            selectedNode={selectedNode}
            tagTree={tagTree}
            renderedTagTree={renderTagTree(tagTree)}
            onSelectNode={(id) => setSelectedIds([id])}
          />
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
          <BoardCanvas
            editMode={editMode}
            boardRef={boardRef}
            boardViewportRef={boardViewportRef}
            viewerRef={viewerRef}
            moveableRef={moveableRef}
            boardZoom={boardZoom}
            isSpacePressed={isSpacePressed}
            isTransforming={isTransforming}
            marqueeSelection={marqueeSelection}
            selectedIds={selectedIds}
            selectedTargets={selectedTargets}
            nodes={nodes}
            onMouseDownViewport={handleBoardViewportMouseDown}
            onSelectNode={(id, event) => {
              if (isSpacePressed) return;
              event.stopPropagation();
              setSelectedIds([id]);
            }}
            onSetTransforming={setIsTransforming}
            onDragNode={handleDrag}
            onResizeNode={handleResize}
            onBindPreviewFrame={bindPreviewFrame}
            buildSrcDoc={buildSrcDoc}
          />

          <GrapesEditorCanvas
            editMode={editMode}
            selectedNode={selectedNode}
            grapesCanvasRef={grapesCanvasRef}
          />
        </main>

        {propertiesOpen && (
          <DesignPanel
            selectedNode={selectedNode}
            selectedHtmlTag={selectedHtmlTag}
            selectedTagCid={selectedTagCid}
            selectedTagText={selectedTagText}
            importTag={importTag}
            importAsChild={importAsChild}
            importSnippet={importSnippet}
            moveTargetCid={moveTargetCid}
            moveTargetOptions={moveTargetOptions}
            styleDraft={styleDraft}
            onUpdateNode={updateNode}
            onSetImportTag={setImportTag}
            onSetImportAsChild={setImportAsChild}
            onSetImportSnippet={setImportSnippet}
            onAddTagToSelectedComponent={addTagToSelectedComponent}
            onSelectRootTag={selectRootTag}
            onImportHtmlSnippetToComponent={importHtmlSnippetToComponent}
            onClearTagSelection={clearTagSelection}
            onApplySelectedTagText={applySelectedTagText}
            onMoveSelectedTagBy={moveSelectedTagBy}
            onNestSelectedTagIntoPreviousSibling={
              nestSelectedTagIntoPreviousSibling
            }
            onOutdentSelectedTag={outdentSelectedTag}
            onSetMoveTargetCid={setMoveTargetCid}
            onMoveSelectedTagIntoTarget={moveSelectedTagIntoTarget}
            onApplyStyleValue={applyStyleValue}
          />
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
