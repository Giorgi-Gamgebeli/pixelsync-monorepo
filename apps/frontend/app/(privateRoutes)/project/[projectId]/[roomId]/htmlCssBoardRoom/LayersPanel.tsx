"use client";

import { useMemo, type ReactNode } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useBoard } from "./BoardContext";
import type { TagTreeNode } from "./types";

export default function LayersPanel() {
  const {
    nodes,
    selectedIds,
    setSelectedIds,
    tagTree,
    selectedTagCid,
    tagDropHint,
    setDragTagCid,
    dragTagCid,
    setTagDropHint,
    resolveTagDropPlacement,
    moveTagByDrop,
    clearTagDragState,
    selectTagByCid,
  } = useBoard();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedIds[0]) ?? null,
    [nodes, selectedIds],
  );

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
    <aside className="border-border bg-secondary flex h-full w-64 flex-col border-r">
      <div className="border-border border-b px-4 py-3">
        <h3 className="text-sm font-medium text-white">Layers</h3>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <section>
          <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
            Pages
          </h4>
          <ul className="space-y-1">
            {nodes.map((node) => (
              <li key={node.id}>
                <button
                  onClick={() => setSelectedIds([node.id])}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                    selectedIds.includes(node.id)
                      ? "bg-brand-500/10 text-brand-400 font-medium"
                      : "hover:bg-surface text-gray-300 hover:text-white"
                  }`}
                >
                  <Icon
                    icon="mdi:file-document-outline"
                    className="text-sm opacity-70"
                  />
                  <span className="truncate">{node.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {selectedNode && (
          <section>
            <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
              Tag Hierarchy
            </h4>
            <ul className="space-y-1">{renderTagTree(tagTree)}</ul>
          </section>
        )}
      </div>
    </aside>
  );
}
