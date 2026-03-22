"use client";

import { useMemo } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { PAGE_PRESETS } from "./constants";
import { useBoard } from "./BoardContext";

export default function RoomHeader() {
  const {
    projectId,
    roomName,
    onlineCount,
    nodes,
    selectedIds,
    editMode,
    editFitPercent,
    boardZoom,
    layersOpen,
    propertiesOpen,
    applyPagePreset,
    updateNode,
    swapPageOrientation,
    zoomOut,
    resetZoom,
    zoomIn,
    setShowInvite,
    setEditMode,
    addPage,
    exportSelected,
    deleteSelected,
    setLayersOpen,
    setPropertiesOpen,
  } = useBoard();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedIds[0]) ?? null,
    [nodes, selectedIds],
  );

  return (
    <div className="border-border flex h-12 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/project/${projectId}`}
          className="hover:bg-surface flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
          aria-label="Back to project"
        >
          <Icon icon="mdi:arrow-left" className="text-lg" />
        </Link>
        <div className="bg-border h-4 w-px" />
        <h2 className="text-sm font-medium text-white">{roomName}</h2>
      </div>

      <div className="flex items-center gap-2">
        {selectedNode && (
          <div className="border-border/70 bg-surface/70 flex items-center gap-1 rounded-lg border px-1.5 py-1">
            <Icon icon="mdi:responsive" className="text-sm text-gray-400" />
            <select
              defaultValue=""
              onChange={(event) => {
                applyPagePreset(event.target.value);
                event.currentTarget.value = "";
              }}
              className="hover:bg-surface focus:bg-surface max-w-[140px] rounded bg-transparent px-1 py-0.5 text-xs text-gray-200 outline-none"
              aria-label="Apply page size preset"
            >
              <option value="" disabled>
                Viewport
              </option>
              {PAGE_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <div className="bg-border/80 mx-1 h-4 w-px" />
            <input
              type="number"
              value={Math.round(selectedNode.w)}
              min={1}
              onChange={(event) =>
                updateNode(selectedNode.id, {
                  w: Math.max(1, Number(event.target.value)),
                })
              }
              className="focus:bg-surface w-16 rounded bg-transparent px-1 py-0.5 text-xs text-gray-200 outline-none"
              aria-label="Viewport width"
            />
            <span className="text-xs text-gray-500">x</span>
            <input
              type="number"
              value={Math.round(selectedNode.h)}
              min={1}
              onChange={(event) =>
                updateNode(selectedNode.id, {
                  h: Math.max(1, Number(event.target.value)),
                })
              }
              className="focus:bg-surface w-16 rounded bg-transparent px-1 py-0.5 text-xs text-gray-200 outline-none"
              aria-label="Viewport height"
            />
            <button
              onClick={swapPageOrientation}
              className="hover:bg-surface ml-0.5 flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-white"
              aria-label="Swap viewport orientation"
            >
              <Icon icon="mdi:phone-rotate-landscape" className="text-sm" />
            </button>
            <div className="bg-border/80 mx-1 h-4 w-px" />
            <Icon
              icon="mdi:drag-horizontal-variant"
              className="text-sm text-gray-400"
            />
            <input
              type="range"
              min={320}
              max={Math.max(3840, Math.round(selectedNode.w) + 200)}
              step={1}
              value={Math.round(selectedNode.w)}
              onChange={(event) =>
                updateNode(selectedNode.id, {
                  w: Math.max(1, Number(event.target.value)),
                })
              }
              className="accent-brand-500 w-24"
              aria-label="Viewport width resizer"
            />
            {editMode && (
              <span className="min-w-[58px] text-right text-[11px] text-gray-400">
                Fit {editFitPercent}%
              </span>
            )}
          </div>
        )}

        <div className="bg-surface/60 flex items-center gap-1.5 rounded-lg px-2.5 py-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-400">{onlineCount} online</span>
        </div>

        {!editMode && (
          <div className="bg-surface/60 ml-1 flex items-center gap-1 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="hover:bg-surface flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-white"
              aria-label="Zoom out"
            >
              <Icon icon="mdi:minus" className="text-sm" />
            </button>
            <button
              onClick={resetZoom}
              className="hover:bg-surface min-w-[52px] rounded px-1.5 py-0.5 text-center text-xs text-gray-300 transition-colors hover:text-white"
              aria-label="Reset zoom"
            >
              {Math.round(boardZoom * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="hover:bg-surface flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-white"
              aria-label="Zoom in"
            >
              <Icon icon="mdi:plus" className="text-sm" />
            </button>
          </div>
        )}

        <button
          onClick={() => setShowInvite(true)}
          className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:share-variant" className="text-sm" />
          Share
        </button>

        <button
          onClick={() => setEditMode(!editMode)}
          disabled={!selectedNode}
          className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon
            icon={
              editMode
                ? "mdi:view-dashboard-outline"
                : "mdi:file-document-edit-outline"
            }
            className="text-sm"
          />
          {editMode ? "Edit Mode" : "Board Mode"}
        </button>

        <div className="bg-border mx-1 h-4 w-px" />

        <button
          onClick={addPage}
          className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:plus-box-outline" className="text-sm" />
          Add Page
        </button>
        <button
          onClick={exportSelected}
          className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
        >
          <Icon icon="mdi:code-braces-box" className="text-sm" />
          Export
        </button>
        <button
          onClick={deleteSelected}
          className="hover:bg-surface flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
          aria-label="Delete selected component"
        >
          <Icon icon="mdi:trash-can-outline" className="text-lg" />
        </button>

        <button
          onClick={() => setLayersOpen(!layersOpen)}
          aria-label="Toggle layers"
          className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
            layersOpen
              ? "bg-brand-500/10 text-brand-400"
              : "hover:bg-surface text-gray-500 hover:text-gray-300"
          }`}
        >
          <Icon icon="mdi:layers-outline" className="text-lg" />
        </button>
        <button
          onClick={() => setPropertiesOpen(!propertiesOpen)}
          aria-label="Toggle properties"
          className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
            propertiesOpen
              ? "bg-brand-500/10 text-brand-400"
              : "hover:bg-surface text-gray-500 hover:text-gray-300"
          }`}
        >
          <Icon icon="mdi:tune-variant" className="text-lg" />
        </button>
      </div>
    </div>
  );
}
