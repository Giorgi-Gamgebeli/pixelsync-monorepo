"use client";

import InfiniteViewer from "react-infinite-viewer";
import Moveable from "react-moveable";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
} from "@/app/(protectedRoutes)/project/[projectId]/[roomId]/htmlCssBoardRoom/constants";
import { useBoard } from "@/app/(protectedRoutes)/project/[projectId]/[roomId]/htmlCssBoardRoom/BoardContext";
import { buildSrcDoc } from "@/app/(protectedRoutes)/project/[projectId]/[roomId]/htmlCssBoardRoom/utils";

export default function BoardCanvas() {
  const {
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
    handleBoardViewportMouseDown,
    setSelectedIds,
    setIsTransforming,
    handleDrag,
    handleResize,
    bindPreviewFrame,
  } = useBoard();

  return (
    <div
      ref={boardViewportRef}
      className={
        editMode
          ? "pointer-events-none relative z-0 block h-full w-full"
          : "relative z-0 block h-full w-full"
      }
      onMouseDown={handleBoardViewportMouseDown}
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
                  className="pointer-events-none h-full w-full border-0"
                  sandbox="allow-same-origin"
                  srcDoc={buildSrcDoc(node)}
                  onLoad={(event) =>
                    bindPreviewFrame(event.currentTarget, node.id)
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
  );
}
