"use client";

import type { HtmlCssNode } from "./types";
import type { RefObject } from "react";

type GrapesEditorCanvasProps = {
  editMode: boolean;
  selectedNode: HtmlCssNode | null;
  grapesCanvasRef: RefObject<HTMLDivElement | null>;
};

export default function GrapesEditorCanvas({
  editMode,
  selectedNode,
  grapesCanvasRef,
}: GrapesEditorCanvasProps) {
  return (
    <div
      className={`absolute inset-0 ${editMode ? "z-10" : "pointer-events-none -z-10 opacity-0"}`}
    >
      <div className="html-css-edit-root relative h-full w-full overflow-hidden [&_.gjs-pn-panels]:hidden">
        <div
          ref={grapesCanvasRef}
          className={`h-full w-full ${selectedNode ? "" : "pointer-events-none opacity-0"}`}
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
