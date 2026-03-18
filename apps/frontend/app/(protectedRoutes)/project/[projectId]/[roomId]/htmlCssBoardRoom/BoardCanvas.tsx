"use client";

import InfiniteViewer from "react-infinite-viewer";
import Moveable from "react-moveable";
import type { MouseEvent, RefObject } from "react";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./constants";
import type { HtmlCssNode, MarqueeSelection } from "./types";

type BoardCanvasProps = {
  editMode: boolean;
  boardRef: RefObject<HTMLDivElement | null>;
  boardViewportRef: RefObject<HTMLDivElement | null>;
  viewerRef: RefObject<any>;
  moveableRef: RefObject<Moveable | null>;
  boardZoom: number;
  isSpacePressed: boolean;
  isTransforming: boolean;
  marqueeSelection: MarqueeSelection | null;
  selectedIds: string[];
  selectedTargets: HTMLElement[];
  nodes: HtmlCssNode[];
  onMouseDownViewport: (event: MouseEvent<HTMLDivElement>) => void;
  onSelectNode: (id: string, event: MouseEvent<HTMLDivElement>) => void;
  onSetTransforming: (value: boolean) => void;
  onDragNode: (id: string, event: any) => void;
  onResizeNode: (id: string, event: any) => void;
  onBindPreviewFrame: (
    iframe: HTMLIFrameElement | null,
    nodeId: string,
    mode: "board" | "edit",
  ) => void;
  buildSrcDoc: (node: HtmlCssNode) => string;
};

export default function BoardCanvas({
  editMode,
  boardRef,
  boardViewportRef,
  viewerRef,
  moveableRef,
  boardZoom,
  isSpacePressed,
  isTransforming,
  marqueeSelection,
  selectedIds,
  selectedTargets,
  nodes,
  onMouseDownViewport,
  onSelectNode,
  onSetTransforming,
  onDragNode,
  onResizeNode,
  onBindPreviewFrame,
  buildSrcDoc,
}: BoardCanvasProps) {
  return (
    <div
      ref={boardViewportRef}
      className={editMode ? "hidden" : "relative z-0 block h-full w-full"}
      onMouseDown={onMouseDownViewport}
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
          className="relative select-none"
          style={{
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT,
          }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              data-node-id={node.id}
              onMouseDown={(event) => onSelectNode(node.id, event)}
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
                  className="pointer-events-none h-full w-full border-0"
                  sandbox="allow-same-origin"
                  srcDoc={buildSrcDoc(node)}
                  onLoad={(event) =>
                    onBindPreviewFrame(event.currentTarget, node.id, "board")
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </InfiniteViewer>

      {marqueeSelection && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <div
            className="border-brand-400 bg-brand-500/15 absolute rounded-sm border"
            style={{
              left: Math.min(
                marqueeSelection.originX,
                marqueeSelection.currentX,
              ),
              top: Math.min(
                marqueeSelection.originY,
                marqueeSelection.currentY,
              ),
              width: Math.max(
                1,
                Math.abs(marqueeSelection.currentX - marqueeSelection.originX),
              ),
              height: Math.max(
                1,
                Math.abs(marqueeSelection.currentY - marqueeSelection.originY),
              ),
            }}
          />
        </div>
      )}

      <Moveable
        ref={moveableRef}
        target={
          isSpacePressed || Boolean(marqueeSelection) ? [] : selectedTargets
        }
        draggable={!isSpacePressed && !marqueeSelection}
        resizable={!isSpacePressed && !marqueeSelection}
        zoom={boardZoom}
        snappable
        keepRatio={false}
        origin={false}
        throttleDrag={0}
        throttleResize={0}
        onDragStart={() => onSetTransforming(true)}
        onDrag={(event) => {
          const target = event.target as HTMLElement;
          const id = target.dataset.nodeId;
          if (!id) return;
          onDragNode(id, event);
        }}
        onDragEnd={() => onSetTransforming(false)}
        onDragGroupStart={() => onSetTransforming(true)}
        onDragGroup={(event) => {
          for (const dragEvent of event.events) {
            const id = (dragEvent.target as HTMLElement).dataset.nodeId;
            if (!id) continue;
            onDragNode(id, dragEvent);
          }
        }}
        onDragGroupEnd={() => onSetTransforming(false)}
        onResizeStart={() => onSetTransforming(true)}
        onResize={(event) => {
          const id = (event.target as HTMLElement).dataset.nodeId;
          if (!id) return;
          onResizeNode(id, event);
        }}
        onResizeEnd={() => onSetTransforming(false)}
        onResizeGroupStart={() => onSetTransforming(true)}
        onResizeGroup={(event) => {
          for (const resizeEvent of event.events) {
            const id = (resizeEvent.target as HTMLElement).dataset.nodeId;
            if (!id) continue;
            onResizeNode(id, resizeEvent);
          }
        }}
        onResizeGroupEnd={() => onSetTransforming(false)}
      />
    </div>
  );
}
