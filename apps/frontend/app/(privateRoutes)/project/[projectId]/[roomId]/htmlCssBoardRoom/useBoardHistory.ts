"use client";

import { useEffect, useRef } from "react";
import type { HtmlCssNode } from "./types";
import { cloneNodes } from "./utils";

type UseBoardHistoryArgs = {
  nodes: HtmlCssNode[];
  selectedIds: string[];
  isReady: boolean;
  onSetNodes: (nodes: HtmlCssNode[]) => void;
  onSetSelectedIds: (ids: string[]) => void;
};

export function useBoardHistory({
  nodes,
  selectedIds,
  isReady,
  onSetNodes,
  onSetSelectedIds,
}: UseBoardHistoryArgs) {
  type HistoryEntry = {
    nodes: HtmlCssNode[];
    selectedIds: string[];
  };
  const previousNodesRef = useRef<HtmlCssNode[] | null>(null);
  const previousSelectedIdsRef = useRef<string[] | null>(null);
  const undoStackRef = useRef<HistoryEntry[]>([]);
  const redoStackRef = useRef<HistoryEntry[]>([]);
  const skipHistoryRef = useRef(false);

  useEffect(() => {
    if (!isReady) return;
    const previous = previousNodesRef.current;
    const previousSelectedIds = previousSelectedIdsRef.current;
    if (!previous) {
      previousNodesRef.current = cloneNodes(nodes);
      previousSelectedIdsRef.current = [...selectedIds];
      return;
    }
    const previousJson = JSON.stringify(previous);
    const currentJson = JSON.stringify(nodes);
    if (previousJson === currentJson) return;
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      previousNodesRef.current = cloneNodes(nodes);
      previousSelectedIdsRef.current = [...selectedIds];
      return;
    }
    undoStackRef.current.push({
      nodes: cloneNodes(previous),
      selectedIds: previousSelectedIds ? [...previousSelectedIds] : [],
    });
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    redoStackRef.current = [];
    previousNodesRef.current = cloneNodes(nodes);
    previousSelectedIdsRef.current = [...selectedIds];
  }, [isReady, nodes, selectedIds]);

  const undoBoard = () => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push({
      nodes: cloneNodes(nodes),
      selectedIds: [...selectedIds],
    });
    skipHistoryRef.current = true;
    const next = cloneNodes(previous.nodes);
    onSetNodes(next);
    const validSelection = previous.selectedIds.filter((id) =>
      next.some((node) => node.id === id),
    );
    onSetSelectedIds(
      validSelection.length > 0 ? validSelection : next[0] ? [next[0].id] : [],
    );
  };

  const redoBoard = () => {
    const nextState = redoStackRef.current.pop();
    if (!nextState) return;
    undoStackRef.current.push({
      nodes: cloneNodes(nodes),
      selectedIds: [...selectedIds],
    });
    skipHistoryRef.current = true;
    const next = cloneNodes(nextState.nodes);
    onSetNodes(next);
    const validSelection = nextState.selectedIds.filter((id) =>
      next.some((node) => node.id === id),
    );
    onSetSelectedIds(
      validSelection.length > 0 ? validSelection : next[0] ? [next[0].id] : [],
    );
  };

  return {
    undoBoard,
    redoBoard,
  };
}
