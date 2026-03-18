"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import type { ReactNode } from "react";
import type { HtmlCssNode, TagTreeNode } from "./types";

type LayersPanelProps = {
  nodes: HtmlCssNode[];
  selectedIds: string[];
  selectedNode: HtmlCssNode | null;
  tagTree: TagTreeNode[];
  renderedTagTree: ReactNode[];
  onSelectNode: (id: string) => void;
};

export default function LayersPanel({
  nodes,
  selectedIds,
  selectedNode,
  tagTree,
  renderedTagTree,
  onSelectNode,
}: LayersPanelProps) {
  return (
    <aside className="scrollbar-thin border-border bg-secondary flex w-64 flex-col border-r">
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">
          Layers
        </h3>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-2">
        <section>
          <p className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            Pages
          </p>
          {nodes.length === 0 ? (
            <p className="px-2 py-3 text-xs text-gray-500">No pages yet</p>
          ) : (
            <ul className="space-y-0.5">
              {nodes.map((node) => {
                const isSelected = selectedIds.includes(node.id);
                return (
                  <li key={node.id}>
                    <button
                      onClick={() => onSelectNode(node.id)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-brand-500/10 text-brand-400 font-medium"
                          : "hover:bg-surface text-gray-300 hover:text-white"
                      }`}
                    >
                      <Icon
                        icon="mdi:file-code-outline"
                        className="text-sm opacity-70"
                      />
                      <span className="truncate">{node.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border-border/60 border-t pt-3">
          <p className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
            Tag Layers
          </p>
          {!selectedNode ? (
            <p className="px-2 py-2 text-xs text-gray-500">
              Select a page to inspect tags.
            </p>
          ) : tagTree.length === 0 ? (
            <p className="px-2 py-2 text-xs text-gray-500">
              No tags yet. Import/select tags from the Design panel.
            </p>
          ) : (
            <ul className="space-y-0.5">{renderedTagTree}</ul>
          )}
        </section>
      </div>
    </aside>
  );
}
