"use client";

import { useEffect, useMemo, useState } from "react";
import { createShapeId, Editor, TLShape } from "tldraw";
import type { HtmlShape } from "@/app/_components/tldraw/HtmlShapeUtil";
import toast from "react-hot-toast";

type PropertiesPanelProps = {
  editor: Editor | null;
};

const ROOT_CLASS = "__ps_root";

const tagOptions = [
  "body",
  "header",
  "main",
  "section",
  "article",
  "nav",
  "footer",
  "div",
  "button",
  "input",
  "img",
  "h1",
  "h2",
  "h3",
  "p",
  "span",
  "ul",
  "li",
];

const inlineTags = new Set([
  "span",
  "a",
  "strong",
  "em",
  "small",
  "label",
  "input",
  "button",
  "img",
]);

function parsePx(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value || "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isInlineTag(tag: string) {
  return inlineTags.has(tag.toLowerCase());
}

function normalizeTag(tag: string) {
  const clean = tag.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!clean || clean === "html" || clean === "head") return "div";
  return clean;
}

function isHtmlShape(shape: TLShape | null): shape is HtmlShape {
  return !!shape && shape.type === "html";
}

function getHtmlShapes(editor: Editor) {
  return editor
    .getCurrentPageShapes()
    .filter((shape): shape is HtmlShape => shape.type === "html");
}

function hasRootClass(className: string) {
  return className.split(/\s+/).includes(ROOT_CLASS);
}

function isRootShape(shape: HtmlShape) {
  return (
    shape.props.parentElementId === "" && hasRootClass(shape.props.className)
  );
}

function getRootShape(shapes: HtmlShape[]) {
  const markedRoot = shapes.find(isRootShape);
  if (markedRoot) return markedRoot;

  // Legacy fallback for old saved canvases before root marker existed.
  return shapes.find(
    (shape) =>
      shape.props.parentElementId === "" &&
      ["div", "body"].includes(normalizeTag(shape.props.tag)),
  );
}

export default function PropertiesPanel({ editor }: PropertiesPanelProps) {
  const [selectedShape, setSelectedShape] = useState<TLShape | null>(null);
  const [importTag, setImportTag] = useState("div");
  const [importAsChild, setImportAsChild] = useState(true);
  const [targetParentId, setTargetParentId] = useState("");

  useEffect(() => {
    if (!editor) return;

    const handleChange = () => {
      const selectedShapes = editor.getSelectedShapes();
      const only = selectedShapes.length === 1 ? selectedShapes[0] : null;
      setSelectedShape(only ?? null);
    };

    handleChange();
    const cleanup = editor.store.listen(handleChange);

    return () => {
      cleanup();
    };
  }, [editor]);

  const selectedHtml = isHtmlShape(selectedShape) ? selectedShape : null;
  const htmlShapes = useMemo(
    () => (editor ? getHtmlShapes(editor) : []),
    [editor, selectedShape],
  );
  const rootShape = useMemo(() => getRootShape(htmlShapes), [htmlShapes]);

  const activeParentId = useMemo(() => {
    if (selectedHtml && importAsChild) return selectedHtml.id;
    return rootShape?.id ?? "";
  }, [importAsChild, rootShape, selectedHtml]);

  useEffect(() => {
    if (!selectedHtml) {
      setTargetParentId("");
      return;
    }
    setTargetParentId(selectedHtml.props.parentElementId || "");
  }, [selectedHtml]);

  const descendants = useMemo(() => {
    if (!selectedHtml) return new Set<string>();
    const byParent = new Map<string, string[]>();
    for (const shape of htmlShapes) {
      const parent = shape.props.parentElementId || "";
      const list = byParent.get(parent) ?? [];
      list.push(shape.id);
      byParent.set(parent, list);
    }

    const result = new Set<string>();
    const stack = [selectedHtml.id as string];
    while (stack.length) {
      const current = stack.pop() as string;
      const children = byParent.get(current) ?? [];
      for (const child of children) {
        if (!result.has(child)) {
          result.add(child);
          stack.push(child);
        }
      }
    }
    return result;
  }, [htmlShapes, selectedHtml]);

  const parentOptions = useMemo(() => {
    if (!selectedHtml) return [];
    return htmlShapes.filter(
      (shape) =>
        shape.id !== selectedHtml.id && !descendants.has(shape.id as string),
    );
  }, [descendants, htmlShapes, selectedHtml]);

  const updateHtmlProp = (
    prop: keyof HtmlShape["props"],
    value: string | number,
  ) => {
    if (!editor || !selectedHtml) return;
    editor.updateShape<HtmlShape>({
      id: selectedHtml.id,
      type: "html",
      props: {
        ...selectedHtml.props,
        [prop]: value,
      },
    });
  };

  const updatePosition = (axis: "x" | "y", value: number) => {
    if (!editor || !selectedHtml) return;
    editor.updateShape<HtmlShape>({
      id: selectedHtml.id,
      type: "html",
      [axis]: Number.isFinite(value) ? value : 0,
    });
  };

  const importElement = () => {
    if (!editor) return;

    if (normalizeTag(importTag) === "body" && rootShape) {
      editor.select(rootShape.id);
      toast("Root body already exists. Selected existing root.");
      return;
    }

    const center = editor.getViewportPageBounds().center;
    const shapeId = createShapeId();
    const safeTag = normalizeTag(importTag);
    const parentId = activeParentId || rootShape?.id || "";

    const parentShape = htmlShapes.find((shape) => shape.id === parentId);
    const isInline = isInlineTag(safeTag);
    const siblingCount = htmlShapes.filter(
      (shape) => shape.props.parentElementId === parentId,
    ).length;
    const parentPadding = parentShape
      ? parsePx(parentShape.props.padding, 12)
      : 12;
    const nextX = parentShape
      ? parentShape.x +
        parentPadding +
        (isInline ? (siblingCount % 5) * 150 : 0)
      : center.x - 140;
    const nextY = parentShape
      ? parentShape.y +
        parentPadding +
        (isInline ? Math.floor(siblingCount / 5) * 58 : siblingCount * 78)
      : center.y - 90;
    const blockWidth = parentShape
      ? Math.max(120, Math.round(parentShape.props.w - parentPadding * 2))
      : 280;

    editor.createShape<HtmlShape>({
      id: shapeId,
      type: "html",
      x: nextX,
      y: nextY,
      props: {
        w: isInline ? 140 : blockWidth,
        h: isInline ? 44 : 76,
        tag: safeTag,
        textContent: safeTag === "button" ? "Button" : `${safeTag} content`,
        className: "",
        parentElementId: parentId,
        display: isInline ? "inline-block" : "block",
        position: "static",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: "0",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "auto",
        top: "",
        left: "",
        right: "",
        bottom: "",
        padding: isInline ? "8px 10px" : "12px",
        margin: "0",
        backgroundColor: "#1f2937",
        color: "#ffffff",
        border: "1px solid #334155",
        borderRadius: "8px",
        fontSize: "14px",
        widthCss: isInline ? "auto" : "100%",
        heightCss: isInline ? "auto" : "100%",
        customCss: "",
      },
    });

    editor.select(shapeId);
  };

  const moveToParent = () => {
    if (!selectedHtml) return;
    const safeParentId = targetParentId || rootShape?.id || "";
    editor?.updateShape<HtmlShape>({
      id: selectedHtml.id,
      type: "html",
      props: {
        ...selectedHtml.props,
        parentElementId: safeParentId,
        position:
          selectedHtml.props.position === "absolute" ? "absolute" : "static",
      },
    });
  };

  const moveToRoot = () => {
    if (!selectedHtml) return;
    if (isRootShape(selectedHtml)) {
      updateHtmlProp("parentElementId", "");
      setTargetParentId("");
      return;
    }

    if (rootShape) {
      updateHtmlProp("parentElementId", rootShape.id);
      setTargetParentId(rootShape.id);
      return;
    }

    updateHtmlProp("parentElementId", "");
    setTargetParentId("");
  };

  if (!editor) return null;

  return (
    <div className="border-border bg-secondary flex h-full w-80 flex-col border-l">
      <div className="border-border border-b px-4 py-3">
        <h3 className="text-sm font-medium text-white">Design</h3>
      </div>

      <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-4">
        <section>
          <h4 className="mb-3 text-xs font-semibold text-gray-400 uppercase">
            Import HTML Tag
          </h4>
          <div className="space-y-2">
            <select
              value={importTag}
              onChange={(event) => setImportTag(event.target.value)}
              className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-2 text-xs text-white outline-none focus:ring-1"
            >
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={importAsChild}
                onChange={(event) => setImportAsChild(event.target.checked)}
              />
              Add as child of selected layer
            </label>
            <button
              onClick={importElement}
              className="bg-brand-500 hover:bg-brand-600 w-full rounded px-3 py-2 text-xs font-medium text-white"
            >
              Import Tag
            </button>
          </div>
        </section>

        {!selectedHtml ? (
          <div className="border-border rounded border p-3 text-xs text-gray-500">
            Select one HTML layer to edit its design settings.
          </div>
        ) : (
          <>
            <section>
              <h4 className="mb-3 text-xs font-semibold text-gray-400 uppercase">
                Element
              </h4>
              <div className="space-y-2">
                <input
                  value={selectedHtml.props.tag}
                  onChange={(event) =>
                    updateHtmlProp("tag", normalizeTag(event.target.value))
                  }
                  className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="tag"
                />
                <input
                  value={selectedHtml.props.className}
                  onChange={(event) =>
                    updateHtmlProp("className", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="className"
                />
                <textarea
                  value={selectedHtml.props.textContent}
                  onChange={(event) =>
                    updateHtmlProp("textContent", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 min-h-[64px] w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="Text content"
                />
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold text-gray-400 uppercase">
                Hierarchy
              </h4>
              <div className="space-y-2">
                <select
                  value={targetParentId}
                  onChange={(event) => setTargetParentId(event.target.value)}
                  className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                >
                  <option value="">Root (no parent)</option>
                  {parentOptions.map((shape) => (
                    <option key={shape.id} value={shape.id}>
                      {isRootShape(shape) ? "<root>" : `<${shape.props.tag}>`}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={moveToParent}
                    className="bg-brand-500 hover:bg-brand-600 rounded px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Move To Parent
                  </button>
                  <button
                    onClick={moveToRoot}
                    className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300"
                  >
                    Move To Root
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold text-gray-400 uppercase">
                Canvas Position
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={Math.round(selectedHtml.x)}
                  onChange={(event) =>
                    updatePosition("x", Number(event.target.value))
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                />
                <input
                  type="number"
                  value={Math.round(selectedHtml.y)}
                  onChange={(event) =>
                    updatePosition("y", Number(event.target.value))
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                />
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold text-gray-400 uppercase">
                Layout
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={selectedHtml.props.widthCss}
                  onChange={(event) =>
                    updateHtmlProp("widthCss", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="width (100%, 100px, 10rem, auto)"
                />
                <input
                  value={selectedHtml.props.heightCss}
                  onChange={(event) =>
                    updateHtmlProp("heightCss", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="height (100%, 100px, 10rem, auto)"
                />
                <input
                  type="number"
                  value={Math.round(selectedHtml.props.w)}
                  onChange={(event) =>
                    updateHtmlProp("w", Number(event.target.value))
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="frame w (px)"
                />
                <input
                  type="number"
                  value={Math.round(selectedHtml.props.h)}
                  onChange={(event) =>
                    updateHtmlProp("h", Number(event.target.value))
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="frame h (px)"
                />
                <select
                  value={selectedHtml.props.position}
                  onChange={(event) =>
                    updateHtmlProp("position", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                >
                  <option value="static">static</option>
                  <option value="relative">relative</option>
                  <option value="absolute">absolute</option>
                  <option value="fixed">fixed</option>
                  <option value="sticky">sticky</option>
                </select>
                <select
                  value={selectedHtml.props.display}
                  onChange={(event) =>
                    updateHtmlProp("display", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                >
                  <option value="block">block</option>
                  <option value="inline-block">inline-block</option>
                  <option value="flex">flex</option>
                  <option value="grid">grid</option>
                  <option value="none">none</option>
                </select>
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold text-gray-400 uppercase">
                Flex / Grid
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedHtml.props.flexDirection}
                  onChange={(event) =>
                    updateHtmlProp("flexDirection", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                >
                  <option value="row">row</option>
                  <option value="column">column</option>
                  <option value="row-reverse">row-reverse</option>
                  <option value="column-reverse">column-reverse</option>
                </select>
                <select
                  value={selectedHtml.props.justifyContent}
                  onChange={(event) =>
                    updateHtmlProp("justifyContent", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                >
                  <option value="flex-start">flex-start</option>
                  <option value="center">center</option>
                  <option value="flex-end">flex-end</option>
                  <option value="space-between">space-between</option>
                  <option value="space-around">space-around</option>
                  <option value="space-evenly">space-evenly</option>
                </select>
                <select
                  value={selectedHtml.props.alignItems}
                  onChange={(event) =>
                    updateHtmlProp("alignItems", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                >
                  <option value="stretch">stretch</option>
                  <option value="flex-start">flex-start</option>
                  <option value="center">center</option>
                  <option value="flex-end">flex-end</option>
                  <option value="baseline">baseline</option>
                </select>
                <input
                  value={selectedHtml.props.gap}
                  onChange={(event) =>
                    updateHtmlProp("gap", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="gap"
                />
                <input
                  value={selectedHtml.props.gridTemplateColumns}
                  onChange={(event) =>
                    updateHtmlProp("gridTemplateColumns", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 col-span-2 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="grid-template-columns"
                />
                <input
                  value={selectedHtml.props.gridTemplateRows}
                  onChange={(event) =>
                    updateHtmlProp("gridTemplateRows", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 col-span-2 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="grid-template-rows"
                />
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold text-gray-400 uppercase">
                Box Model
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={selectedHtml.props.padding}
                  onChange={(event) =>
                    updateHtmlProp("padding", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="padding"
                />
                <input
                  value={selectedHtml.props.margin}
                  onChange={(event) =>
                    updateHtmlProp("margin", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="margin"
                />
                <input
                  value={selectedHtml.props.top}
                  onChange={(event) =>
                    updateHtmlProp("top", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="top"
                />
                <input
                  value={selectedHtml.props.left}
                  onChange={(event) =>
                    updateHtmlProp("left", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="left"
                />
                <input
                  value={selectedHtml.props.right}
                  onChange={(event) =>
                    updateHtmlProp("right", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="right"
                />
                <input
                  value={selectedHtml.props.bottom}
                  onChange={(event) =>
                    updateHtmlProp("bottom", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="bottom"
                />
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-xs font-semibold text-gray-400 uppercase">
                Visual
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={selectedHtml.props.backgroundColor}
                  onChange={(event) =>
                    updateHtmlProp("backgroundColor", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="background"
                />
                <input
                  value={selectedHtml.props.color}
                  onChange={(event) =>
                    updateHtmlProp("color", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="text color"
                />
                <input
                  value={selectedHtml.props.border}
                  onChange={(event) =>
                    updateHtmlProp("border", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 col-span-2 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="border"
                />
                <input
                  value={selectedHtml.props.borderRadius}
                  onChange={(event) =>
                    updateHtmlProp("borderRadius", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="border-radius"
                />
                <input
                  value={selectedHtml.props.fontSize}
                  onChange={(event) =>
                    updateHtmlProp("fontSize", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="font-size"
                />
                <textarea
                  value={selectedHtml.props.customCss}
                  onChange={(event) =>
                    updateHtmlProp("customCss", event.target.value)
                  }
                  className="bg-surface focus:ring-brand-500 col-span-2 min-h-[72px] rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="custom css: line-height: 1.5; box-shadow: 0 10px 20px rgba(0,0,0,.2);"
                />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
