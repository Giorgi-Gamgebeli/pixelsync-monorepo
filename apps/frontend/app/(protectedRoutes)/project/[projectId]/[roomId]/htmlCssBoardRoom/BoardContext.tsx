"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type Dispatch,
  type SetStateAction,
  type RefObject,
} from "react";
import toast from "react-hot-toast";
import { useBoardMode } from "./useBoardMode";
import { useGrapesLifecycle } from "./useGrapesLifecycle";
import { useBoardUiState } from "./useBoardUiState";
import { useBoardDocumentState } from "./useBoardDocumentState";
import { useBoardHistory } from "./useBoardHistory";
import {
  componentTreeContainsCid,
  findComponentByCid,
  getComponentChildren,
  getLastComponentFromInsertResult,
  readComponentText,
  readStyleDraft,
} from "./tagTree";
import type {
  HtmlCssNode,
  MarqueeSelection,
  StyleDraft,
  TagDropPlacement,
  TagTreeNode,
} from "./types";
import type {
  BoardViewerLike,
  GrapesEditorLike,
  MoveableDragLikeEvent,
  MoveableRefLike,
  MoveableResizeLikeEvent,
} from "./contracts";
import {
  createDefaultNode,
  createEmptyStyleDraft,
  getTagTemplate,
  isTextInputTarget,
} from "./utils";
import { PAGE_PRESETS } from "./constants";

type BoardContextType = {
  roomId: number;
  projectId: string;
  roomName: string;
  onlineCount: number;
  nodes: HtmlCssNode[];
  selectedIds: string[];
  isReady: boolean;
  editMode: boolean;
  layersOpen: boolean;
  propertiesOpen: boolean;
  showInvite: boolean;
  importTag: string;
  importAsChild: boolean;
  importSnippet: string;
  selectedHtmlTag: string;
  selectedTagCid: string | null;
  moveTargetCid: string;
  dragTagCid: string | null;
  tagDropHint: { targetCid: string; placement: TagDropPlacement } | null;
  tagTree: TagTreeNode[];
  styleDraft: StyleDraft;
  selectedTagText: string;

  boardRef: RefObject<HTMLDivElement | null>;
  boardViewportRef: RefObject<HTMLDivElement | null>;
  viewerRef: RefObject<BoardViewerLike | null>;
  moveableRef: RefObject<MoveableRefLike>;
  selectedTargets: HTMLElement[];
  isTransforming: boolean;
  setIsTransforming: Dispatch<SetStateAction<boolean>>;
  boardZoom: number;
  isSpacePressed: boolean;
  marqueeSelection: MarqueeSelection | null;

  handleDrag: (id: string, event: MoveableDragLikeEvent) => void;
  handleResize: (id: string, event: MoveableResizeLikeEvent) => void;

  grapesCanvasRef: RefObject<HTMLDivElement | null>;
  grapesEditorRef: RefObject<GrapesEditorLike | null>;
  editFitPercent: number;
  isGrapesReady: boolean;

  setNodes: (nodes: HtmlCssNode[]) => void;
  setSelectedIds: (ids: string[]) => void;
  setEditMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  setLayersOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setPropertiesOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setShowInvite: (value: boolean) => void;
  setImportTag: (value: string) => void;
  setImportAsChild: (value: boolean) => void;
  setImportSnippet: (value: string) => void;
  setMoveTargetCid: (value: string) => void;

  updateNode: (id: string, patch: Partial<HtmlCssNode>) => void;
  addPage: () => void;
  deleteSelected: () => void;
  undoBoard: () => void;
  redoBoard: () => void;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerNodeInViewport: (id: string) => void;
  handleBoardViewportMouseDown: (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => void;
  bindPreviewFrame: (iframe: HTMLIFrameElement | null, nodeId: string) => void;

  applyPagePreset: (presetKey: string) => void;
  swapPageOrientation: () => void;
  exportSelected: () => void;
  addTagToSelectedComponent: () => void;
  importHtmlSnippetToComponent: () => void;
  selectRootTag: () => void;
  clearTagSelection: () => void;
  selectTagByCid: (cid: string) => void;
  moveTagByDrop: (
    sourceCid: string,
    targetCid: string,
    placement: TagDropPlacement,
  ) => void;
  moveSelectedTagBy: (delta: number) => void;
  nestSelectedTagIntoPreviousSibling: () => void;
  outdentSelectedTag: () => void;
  moveSelectedTagIntoTarget: () => void;
  applyStyleValue: (key: string, value: string) => void;
  applySelectedTagText: (value: string) => void;

  setDragTagCid: (cid: string | null) => void;
  setTagDropHint: (
    hint: { targetCid: string; placement: TagDropPlacement } | null,
  ) => void;
  resolveTagDropPlacement: (
    event: DragEvent<HTMLButtonElement>,
  ) => TagDropPlacement;
  clearTagDragState: () => void;
};

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export function BoardProvider({
  roomId,
  projectId,
  roomName,
  onlineCount,
  children,
}: {
  roomId: number;
  projectId: string;
  roomName: string;
  onlineCount: number;
  children: ReactNode;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const {
    layersOpen,
    setLayersOpen,
    propertiesOpen,
    setPropertiesOpen,
    editMode,
    setEditMode,
    showInvite,
    setShowInvite,
  } = useBoardUiState();
  const { nodes, setNodes, isReady } = useBoardDocumentState({
    roomId,
    onSetSelectedIds: setSelectedIds,
  });

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
    isGrapesReady,
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

  const { undoBoard, redoBoard } = useBoardHistory({
    nodes,
    selectedIds,
    isReady,
    onSetNodes: setNodes,
    onSetSelectedIds: setSelectedIds,
  });

  const editModeRef = useRef(editMode);
  const selectedIdsRef = useRef(selectedIds);
  const actionsRef = useRef({
    resetZoom,
    zoomOut,
    zoomIn,
    redoBoard,
    undoBoard,
  });

  useEffect(() => {
    editModeRef.current = editMode;
    selectedIdsRef.current = selectedIds;
    actionsRef.current = {
      resetZoom,
      zoomOut,
      zoomIn,
      redoBoard,
      undoBoard,
    };
  }, [editMode, selectedIds, resetZoom, zoomOut, zoomIn, redoBoard, undoBoard]);

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if (isTextInputTarget(event.target)) return;
      const key = event.key.toLowerCase();
      const hasMeta = event.ctrlKey || event.metaKey;
      const code = event.code;
      if (
        !editModeRef.current &&
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
          actionsRef.current.resetZoom();
          return;
        }
        if (key === "-" || key === "_" || code === "NumpadSubtract") {
          actionsRef.current.zoomOut();
          return;
        }
        actionsRef.current.zoomIn();
        return;
      }
      if (!editModeRef.current && (key === "delete" || key === "backspace")) {
        if (selectedIdsRef.current.length === 0) return;
        event.preventDefault();
        setNodes((prev) =>
          prev.filter((node) => !selectedIdsRef.current.includes(node.id)),
        );
        setSelectedIds([]);
        setEditMode(false);
        toast.success("Page removed");
        return;
      }
      if (hasMeta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) actionsRef.current.redoBoard();
        else actionsRef.current.undoBoard();
        return;
      }
      if (hasMeta && key === "y") {
        event.preventDefault();
        actionsRef.current.redoBoard();
      }
    };
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, []);

  useEffect(() => {
    if (editMode && !selectedNode) setEditMode(false);
  }, [editMode, selectedNode]);

  useEffect(() => {
    if (!selectedTagCid) {
      setMoveTargetCid("");
      return;
    }
    if (moveTargetCid === selectedTagCid) setMoveTargetCid("");
  }, [moveTargetCid, selectedTagCid]);

  useEffect(() => {
    if (editMode) return;
    setDragTagCid(null);
    setTagDropHint(null);
  }, [editMode]);

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

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    setNodes((prev) => prev.filter((node) => !selectedIds.includes(node.id)));
    setSelectedIds([]);
    setEditMode(false);
    toast.success("Page removed");
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
      w: Math.max(1, Math.round(selectedNode.h)),
      h: Math.max(1, Math.round(selectedNode.w)),
    });
  };

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

  const applyTagSelection = (component: any, fallbackTag = "(none)") => {
    if (!component) {
      setSelectedTagCid(null);
      setSelectedHtmlTag("(none)");
      setStyleDraft(createEmptyStyleDraft());
      setSelectedTagText("");
      return;
    }
    setSelectedTagCid(component?.cid ? String(component.cid) : null);
    setSelectedHtmlTag(
      String(component?.get?.("tagName") ?? fallbackTag).toLowerCase(),
    );
    setStyleDraft(readStyleDraft(component));
    setSelectedTagText(readComponentText(component));
  };

  const commitTagChanges = (editor: any) => {
    syncActiveNodeFromEditor(editor);
    rebuildTagTree();
  };

  const addTagToSelectedComponent = () => {
    const editor = grapesEditorRef.current;
    if (!editor || !selectedNode) return;
    try {
      const template = getTagTemplate(importTag);
      const wrapper = editor.getWrapper?.();
      if (!wrapper) return;
      const selected = editor.getSelected?.();
      const selectedType = String(selected?.get?.("type") ?? "")
        .toLowerCase()
        .trim();
      const canAppendToSelected =
        Boolean(selected?.append) && selectedType !== "textnode";
      const parent = importAsChild && canAppendToSelected ? selected : wrapper;
      const added = parent?.append
        ? parent.append(template)
        : editor.addComponents(template);
      const nextSelection = getLastComponentFromInsertResult(added);
      if (nextSelection) {
        editor.select(nextSelection);
        applyTagSelection(nextSelection, importTag);
      } else {
        editor.select(parent);
        applyTagSelection(parent);
      }
      commitTagChanges(editor);
      toast.success(`Imported <${importTag}>`);
    } catch (error) {
      toast.error("Tag import failed");
    }
  };

  const importHtmlSnippetToComponent = () => {
    const editor = grapesEditorRef.current;
    if (!editor || !selectedNode) return;
    const snippet = importSnippet.trim();
    if (!snippet) {
      toast.error("Enter HTML snippet first");
      return;
    }
    try {
      const wrapper = editor.getWrapper?.();
      if (!wrapper) return;
      const selected = editor.getSelected?.();
      const selectedType = String(selected?.get?.("type") ?? "")
        .toLowerCase()
        .trim();
      const canAppendToSelected =
        Boolean(selected?.append) && selectedType !== "textnode";
      const parent = importAsChild && canAppendToSelected ? selected : wrapper;
      const added = parent?.append
        ? parent.append(snippet)
        : editor.addComponents(snippet);
      const nextSelection = getLastComponentFromInsertResult(added);
      if (nextSelection) {
        editor.select(nextSelection);
        applyTagSelection(nextSelection);
      }
      commitTagChanges(editor);
      toast.success("HTML snippet imported");
    } catch (error) {
      toast.error("HTML snippet import failed");
    }
  };

  const selectRootTag = () => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;
    editor.select(wrapper);
    applyTagSelection(wrapper, "body");
  };

  const clearTagSelection = () => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    editor.select(null);
    applyTagSelection(null);
  };

  const selectTagByCid = (cid: string) => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;
    const component = findComponentByCid(wrapper, cid);
    if (!component) return;
    editor.select(component);
    applyTagSelection(component);
  };

  const refreshSelectedTagState = (editor: any, component: any) => {
    editor.select(component);
    applyTagSelection(component);
    commitTagChanges(editor);
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
    if (!editor) return;
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
      sourceParent.components?.().remove(source, { silent: true });
      target.append(source);
      refreshSelectedTagState(editor, source);
      return;
    }
    const targetParent = target.parent?.();
    if (!targetParent) {
      sourceParent.components?.().remove(source, { silent: true });
      wrapper.append(source);
      refreshSelectedTagState(editor, source);
      return;
    }
    const targetCollection = targetParent.components?.();
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
    sourceParent.components?.().remove(source, { silent: true });
    targetCollection.add(source, { at: insertAt });
    refreshSelectedTagState(editor, source);
  };

  const moveSelectedTagBy = (delta: number) => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const selected = editor.getSelected?.();
    if (!selected) return;
    const parent = selected.parent?.();
    if (!parent) return;
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
    parentComponents.remove(selected, { silent: true });
    parentComponents.add(selected, { at: nextIndex });
    refreshSelectedTagState(editor, selected);
  };

  const nestSelectedTagIntoPreviousSibling = () => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const selected = editor.getSelected?.();
    if (!selected) return;
    const parent = selected.parent?.();
    if (!parent) return;
    const siblings = getComponentChildren(parent);
    const currentIndex = siblings.findIndex(
      (item) => String(item?.cid) === String(selected?.cid),
    );
    if (currentIndex <= 0) return;
    const target = siblings[currentIndex - 1];
    if (String(target?.get?.("type") ?? "").toLowerCase() === "textnode")
      return;
    parent.components?.().remove(selected, { silent: true });
    target.append(selected);
    refreshSelectedTagState(editor, selected);
  };

  const outdentSelectedTag = () => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const selected = editor.getSelected?.();
    const parent = selected?.parent?.();
    const grandParent = parent?.parent?.();
    if (!parent || !grandParent) return;
    const grandSiblings = getComponentChildren(grandParent);
    const parentIndex = grandSiblings.findIndex(
      (item) => String(item?.cid) === String(parent?.cid),
    );
    const insertAt = parentIndex >= 0 ? parentIndex + 1 : grandSiblings.length;
    parent.components?.().remove(selected, { silent: true });
    grandParent.components?.().add(selected, { at: insertAt });
    refreshSelectedTagState(editor, selected);
  };

  const moveSelectedTagIntoTarget = () => {
    const editor = grapesEditorRef.current;
    if (!editor) return;
    const selected = editor.getSelected?.();
    if (!selected || !moveTargetCid) return;
    const wrapper = editor.getWrapper?.();
    const target = findComponentByCid(wrapper, moveTargetCid);
    if (
      !target ||
      String(target?.get?.("type") ?? "").toLowerCase() === "textnode"
    )
      return;
    if (String(selected?.cid) === String(target?.cid)) return;
    if (componentTreeContainsCid(selected, moveTargetCid)) {
      toast.error("Cannot move a tag into its own child");
      return;
    }
    const currentParent = selected.parent?.();
    if (!currentParent) return;
    currentParent.components?.().remove(selected, { silent: true });
    target.append(selected);
    refreshSelectedTagState(editor, selected);
  };

  const applyStyleValue = (key: string, value: string) => {
    setStyleDraft((prev) => ({ ...prev, [key]: value }));
    const editor = grapesEditorRef.current;
    const selected = editor?.getSelected?.();
    if (!selected) return;
    const nextStyle = {
      ...((selected.getStyle?.() ?? {}) as Record<string, string>),
    };
    if (value.trim() === "") delete nextStyle[key];
    else nextStyle[key] = value;
    selected.setStyle(nextStyle);
    commitTagChanges(editor);
  };

  const applySelectedTagText = (value: string) => {
    setSelectedTagText(value);
    const editor = grapesEditorRef.current;
    const selected = editor?.getSelected?.();
    if (!selected) return;
    const selectedType = String(selected?.get?.("type") ?? "")
      .toLowerCase()
      .trim();
    if (selectedType === "textnode" || selectedType === "text") {
      selected.set?.("content", value);
    } else {
      const children = getComponentChildren(selected);
      const textChild = children.find((child) => {
        const type = String(child?.get?.("type") ?? "")
          .toLowerCase()
          .trim();
        return type === "textnode" || type === "text";
      });
      if (textChild) textChild.set?.("content", value);
      else if (selected.append) selected.append(value);
      else selected.set?.("content", value);
    }
    commitTagChanges(editor);
  };

  const value: BoardContextType = {
    roomId,
    projectId,
    roomName,
    onlineCount,
    nodes,
    selectedIds,
    isReady,
    editMode,
    layersOpen,
    propertiesOpen,
    showInvite,
    importTag,
    importAsChild,
    importSnippet,
    selectedHtmlTag,
    selectedTagCid,
    moveTargetCid,
    dragTagCid,
    tagDropHint,
    tagTree,
    styleDraft,
    selectedTagText,

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

    grapesCanvasRef,
    grapesEditorRef,
    editFitPercent,
    isGrapesReady,

    setNodes,
    setSelectedIds,
    setEditMode,
    setLayersOpen,
    setPropertiesOpen,
    setShowInvite,
    setImportTag,
    setImportAsChild,
    setImportSnippet,
    setMoveTargetCid,

    updateNode,
    addPage,
    deleteSelected,
    undoBoard,
    redoBoard,
    resetZoom,
    zoomIn,
    zoomOut,
    centerNodeInViewport,
    handleDrag,
    handleResize,
    handleBoardViewportMouseDown,
    bindPreviewFrame,

    applyPagePreset,
    swapPageOrientation,
    exportSelected,
    addTagToSelectedComponent,
    importHtmlSnippetToComponent,
    selectRootTag,
    clearTagSelection,
    selectTagByCid,
    moveTagByDrop,
    moveSelectedTagBy,
    nestSelectedTagIntoPreviousSibling,
    outdentSelectedTag,
    moveSelectedTagIntoTarget,
    applyStyleValue,
    applySelectedTagText,

    setDragTagCid,
    setTagDropHint,
    resolveTagDropPlacement,
    clearTagDragState,
  };

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
}
