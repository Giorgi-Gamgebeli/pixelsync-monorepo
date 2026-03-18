"use client";

import { Editor, TLShapeId, TLShape } from "tldraw";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import type { HtmlShape } from "@/app/_components/tldraw/HtmlShapeUtil";

type ComponentTreeProps = {
  editor: Editor | null;
};

type HtmlNode = {
  id: TLShapeId;
  label: string;
  children: HtmlNode[];
};

const ROOT_CLASS = "__ps_root";

function isRootShape(shape: HtmlShape) {
  return (
    shape.props.parentElementId === "" &&
    shape.props.className.split(/\s+/).includes(ROOT_CLASS)
  );
}

export default function ComponentTree({ editor }: ComponentTreeProps) {
  const [shapes, setShapes] = useState<TLShape[]>([]);
  const [selectedIds, setSelectedIds] = useState<TLShapeId[]>([]);

  useEffect(() => {
    if (!editor) return;

    // Initial state
    setShapes(Array.from(editor.getCurrentPageShapes()));
    setSelectedIds(editor.getSelectedShapeIds());

    // Subscribe to changes
    const handleChange = () => {
      setShapes(Array.from(editor.getCurrentPageShapes()));
      setSelectedIds(editor.getSelectedShapeIds());
    };

    editor.store.listen(handleChange, { scope: "document", source: "user" });
    editor.store.listen(handleChange, { scope: "document", source: "remote" });

    // Listen to all store changes to catch selection changes too
    const cleanup = editor.store.listen(handleChange);

    return () => {
      cleanup();
    };
  }, [editor]);

  const tree = useMemo(() => {
    const htmlShapes = shapes.filter(
      (shape): shape is HtmlShape => shape.type === "html",
    );

    const childrenByParent = new Map<string, HtmlShape[]>();
    const allIds = new Set(htmlShapes.map((shape) => shape.id));

    for (const shape of htmlShapes) {
      const parent = shape.props.parentElementId || "__root__";
      const key = allIds.has(parent as TLShapeId) ? parent : "__root__";
      const bucket = childrenByParent.get(key) ?? [];
      bucket.push(shape);
      childrenByParent.set(key, bucket);
    }

    const build = (parentId: string): HtmlNode[] => {
      const children = childrenByParent.get(parentId) ?? [];
      return children
        .sort((a, b) => a.index.localeCompare(b.index))
        .map((shape) => ({
          id: shape.id,
          label: isRootShape(shape)
            ? "<root>"
            : `<${shape.props.tag || "div"}>`,
          children: build(shape.id),
        }));
    };

    return build("__root__");
  }, [shapes]);

  if (!editor) {
    return (
      <div className="border-border bg-secondary flex flex-1 flex-col items-center justify-center border-t p-4">
        <Icon
          icon="mdi:loading"
          className="animate-spin text-xl text-gray-500"
        />
      </div>
    );
  }

  const handleSelect = (id: TLShapeId) => {
    editor.select(id);
  };

  function renderNode(node: HtmlNode, depth = 0) {
    const isSelected = selectedIds.includes(node.id);
    return (
      <li key={node.id}>
        <button
          onClick={() => handleSelect(node.id)}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
            isSelected
              ? "bg-brand-500/10 text-brand-400 font-medium"
              : "hover:bg-surface text-gray-300 hover:text-white"
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <Icon icon="mdi:file-code-outline" className="text-sm opacity-70" />
          <span className="truncate">{node.label}</span>
        </button>
        {node.children.length > 0 && (
          <ul className="space-y-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="border-border bg-secondary flex flex-1 flex-col border-t">
      <div className="border-border flex items-center justify-between border-b px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">
          Layers
        </h3>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">
            No HTML elements yet
          </div>
        ) : (
          <ul className="space-y-0.5">
            {tree.map((node) => renderNode(node))}
          </ul>
        )}
      </div>
    </div>
  );
}
