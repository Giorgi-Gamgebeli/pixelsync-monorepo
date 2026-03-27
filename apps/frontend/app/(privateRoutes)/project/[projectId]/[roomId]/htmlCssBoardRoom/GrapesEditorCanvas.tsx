"use client";

import { useMemo } from "react";
import { useBoard } from "@/app/(privateRoutes)/project/[projectId]/[roomId]/htmlCssBoardRoom/BoardContext";

export default function GrapesEditorCanvas() {
  const { editMode, nodes, selectedIds, grapesCanvasRef, isGrapesReady } =
    useBoard();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedIds[0]) ?? null,
    [nodes, selectedIds],
  );

  return (
    <div
      className={`absolute inset-0 ${
        editMode
          ? `z-10 ${isGrapesReady ? "" : "pointer-events-none opacity-0"}`
          : "pointer-events-none -z-10 opacity-0"
      }`}
    >
      <div className="html-css-edit-root relative h-full w-full overflow-hidden [&_.gjs-pn-panels]:hidden">
        <div
          ref={grapesCanvasRef}
          className={`h-full w-full ${
            selectedNode && isGrapesReady ? "" : "pointer-events-none opacity-0"
          }`}
        />
        {!selectedNode && (
          <div className="border-border bg-secondary absolute inset-0 flex items-center justify-center rounded-lg border text-xs text-gray-400">
            Select a page to load the editor.
          </div>
        )}
      </div>
    </div>
  );
}
