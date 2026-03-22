"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getHtmlCssBoardPayload,
  saveHtmlCssBoardPayload,
} from "@/app/_dataAccessLayer/actions";
import type { HtmlCssNode } from "./types";

type UseBoardDocumentStateArgs = {
  roomId: number;
  onSetSelectedIds: (ids: string[]) => void;
};

export function useBoardDocumentState({
  roomId,
  onSetSelectedIds,
}: UseBoardDocumentStateArgs) {
  const [nodes, setNodes] = useState<HtmlCssNode[]>([]);
  const [isReady, setIsReady] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef("");
  const saveVersionRef = useRef(0);

  useEffect(() => {
    const load = async () => {
      const payload = await getHtmlCssBoardPayload(roomId);
      if (payload && typeof payload === "object" && "error" in payload) {
        toast.error(payload.error);
        setNodes([]);
        onSetSelectedIds([]);
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
      onSetSelectedIds(nextNodes[0] ? [nextNodes[0].id] : []);
      setIsReady(true);
    };

    load();
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [roomId, onSetSelectedIds]);

  useEffect(() => {
    if (!isReady) return;
    const payload = JSON.stringify({ nodes });
    if (payload === lastPayloadRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const requestVersion = ++saveVersionRef.current;
      const result = await saveHtmlCssBoardPayload(roomId, payload);
      if (result && typeof result === "object" && "error" in result) {
        toast.error("Failed to save HTML/CSS board");
        return;
      }
      if (requestVersion !== saveVersionRef.current) return;
      lastPayloadRef.current = payload;
    }, 750);
  }, [isReady, nodes, roomId]);

  return {
    nodes,
    setNodes,
    isReady,
  };
}
