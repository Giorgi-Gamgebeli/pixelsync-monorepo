"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Moveable from "react-moveable";
import { INITIAL_BOARD_ZOOM } from "./constants";
import type { HtmlCssNode, MarqueeSelection } from "./types";
import type {
  BoardViewerLike,
  MoveableDragLikeEvent,
  MoveableResizeLikeEvent,
} from "./contracts";
import { isTextInputTarget } from "./utils";

type UseBoardModeArgs = {
  editMode: boolean;
  isReady: boolean;
  roomId: number;
  nodes: HtmlCssNode[];
  selectedIds: string[];
  onSetSelectedIds: (ids: string[]) => void;
  onUpdateNode: (id: string, patch: Partial<HtmlCssNode>) => void;
};

export function useBoardMode({
  editMode,
  isReady,
  roomId,
  nodes,
  selectedIds,
  onSetSelectedIds,
  onUpdateNode,
}: UseBoardModeArgs) {
  const [selectedTargets, setSelectedTargets] = useState<HTMLElement[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [boardZoom, setBoardZoom] = useState(INITIAL_BOARD_ZOOM);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [marqueeSelection, setMarqueeSelection] =
    useState<MarqueeSelection | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const boardViewportRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<BoardViewerLike | null>(null);
  const moveableRef = useRef<Moveable | null>(null);
  const zoomAnimationFrameRef = useRef<number | null>(null);
  const targetZoomRef = useRef(1);
  const zoomPointerRef = useRef<{ x: number; y: number } | null>(null);
  const initialZoomAppliedRef = useRef(false);
  const bodyUserSelectRef = useRef<string | null>(null);

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
  const resetZoom = () => setViewerZoomSmooth(INITIAL_BOARD_ZOOM);

  const handleDrag = (id: string, event: MoveableDragLikeEvent) => {
    const [x = 0, y = 0] = event.beforeTranslate;
    onUpdateNode(id, { x, y });
  };

  const handleResize = (id: string, event: MoveableResizeLikeEvent) => {
    const [x = 0, y = 0] = event.drag.beforeTranslate;
    const width = Math.max(1, Math.round(event.width));
    const height = Math.max(1, Math.round(event.height));
    onUpdateNode(id, { x, y, w: width, h: height });
  };

  const centerNodeInViewport = (nodeId: string) => {
    const viewer = viewerRef.current;
    const board = boardRef.current;
    if (!viewer || !board) return;

    const container = viewer.getContainer?.() as HTMLElement | undefined;
    if (!container) return;

    const nodeElement = board.querySelector(
      `[data-node-id="${nodeId}"]`,
    ) as HTMLElement | null;
    if (!nodeElement) return;

    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;

    const containerRect = container.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();
    const zoom = getViewerZoom();
    if (!Number.isFinite(zoom) || zoom <= 0) return;

    const deltaXScreen =
      containerRect.left +
      containerRect.width / 2 -
      (nodeRect.left + nodeRect.width / 2);
    const deltaYScreen =
      containerRect.top +
      containerRect.height / 2 -
      (nodeRect.top + nodeRect.height / 2);
    const deltaX = deltaXScreen / zoom;
    const deltaY = deltaYScreen / zoom;

    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return;

    onUpdateNode(nodeId, {
      x: Math.round(node.x + deltaX),
      y: Math.round(node.y + deltaY),
    });
  };

  const handleBoardViewportMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest(".html-css-node")) return;
    if (target.closest(".moveable-control-box")) return;

    onSetSelectedIds([]);

    if (editMode || isSpacePressed || event.button !== 0) return;

    const board = boardRef.current;
    const viewport = boardViewportRef.current;
    if (!board || !viewport) return;

    event.preventDefault();

    const getRelativePoint = (clientX: number, clientY: number) => {
      const rect = viewport.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const originPoint = getRelativePoint(event.clientX, event.clientY);
    const originX = originPoint.x;
    const originY = originPoint.y;

    const initialSelection: MarqueeSelection = {
      originX,
      originY,
      currentX: originX,
      currentY: originY,
    };
    setMarqueeSelection(initialSelection);

    if (bodyUserSelectRef.current === null) {
      bodyUserSelectRef.current = document.body.style.userSelect;
    }
    document.body.style.userSelect = "none";

    const pickSelectedNodeIds = (selection: MarqueeSelection): string[] => {
      const viewportRect = viewport.getBoundingClientRect();
      const left = Math.min(selection.originX, selection.currentX);
      const right = Math.max(selection.originX, selection.currentX);
      const top = Math.min(selection.originY, selection.currentY);
      const bottom = Math.max(selection.originY, selection.currentY);

      const nodeElements = Array.from(
        board.querySelectorAll<HTMLElement>("[data-node-id]"),
      );
      return nodeElements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const nodeLeft = rect.left - viewportRect.left;
          const nodeRight = rect.right - viewportRect.left;
          const nodeTop = rect.top - viewportRect.top;
          const nodeBottom = rect.bottom - viewportRect.top;
          return !(
            nodeRight < left ||
            nodeLeft > right ||
            nodeBottom < top ||
            nodeTop > bottom
          );
        })
        .map((element) => element.dataset.nodeId)
        .filter((id): id is string => Boolean(id));
    };

    const applySelectionFromPoint = (clientX: number, clientY: number) => {
      const point = getRelativePoint(clientX, clientY);
      const nextSelection: MarqueeSelection = {
        originX,
        originY,
        currentX: point.x,
        currentY: point.y,
      };
      setMarqueeSelection(nextSelection);
      onSetSelectedIds(pickSelectedNodeIds(nextSelection));
    };

    const clearSelections = () => {
      document.getSelection?.()?.removeAllRanges();
      const frames = Array.from(
        board.querySelectorAll<HTMLIFrameElement>(".html-css-node iframe"),
      );
      for (const frame of frames) {
        frame.contentDocument?.getSelection?.()?.removeAllRanges();
      }
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      applySelectionFromPoint(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      applySelectionFromPoint(upEvent.clientX, upEvent.clientY);
      setMarqueeSelection(null);

      if (bodyUserSelectRef.current !== null) {
        document.body.style.userSelect = bodyUserSelectRef.current;
        bodyUserSelectRef.current = null;
      }

      clearSelections();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

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
    if (!isReady || editMode) return;
    if (initialZoomAppliedRef.current) return;

    let frameId: number | null = null;
    const tryApplyInitialZoom = () => {
      const viewer = viewerRef.current;
      if (!viewer) {
        frameId = requestAnimationFrame(tryApplyInitialZoom);
        return;
      }

      initialZoomAppliedRef.current = true;
      setViewerZoom(INITIAL_BOARD_ZOOM);
    };

    frameId = requestAnimationFrame(tryApplyInitialZoom);
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [editMode, isReady]);

  useEffect(() => {
    initialZoomAppliedRef.current = false;
    targetZoomRef.current = INITIAL_BOARD_ZOOM;
    setBoardZoom(INITIAL_BOARD_ZOOM);
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (bodyUserSelectRef.current !== null) {
        document.body.style.userSelect = bodyUserSelectRef.current;
        bodyUserSelectRef.current = null;
      }
      if (zoomAnimationFrameRef.current !== null) {
        cancelAnimationFrame(zoomAnimationFrameRef.current);
        zoomAnimationFrameRef.current = null;
      }
    };
  }, []);

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
    if (editMode) return;
    if (selectedTargets.length === 0) return;

    const frame = requestAnimationFrame(() => {
      moveableRef.current?.updateRect();
    });

    return () => cancelAnimationFrame(frame);
  }, [editMode, boardZoom, selectedTargets, nodes]);

  return {
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
  };
}
