"use client";

import { useEffect, useMemo, useRef } from "react";
import { createShapeId, defaultTools, Editor, TLRecord, Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { HtmlShapeUtil } from "./tldraw/HtmlShapeUtil";
import type { HtmlShape } from "./tldraw/HtmlShapeUtil";

type WhiteBoardProps = {
  onEditorMount?: (editor: Editor) => void;
  initialRecords?: TLRecord[];
  onRecordsChange?: (records: TLRecord[]) => void;
};

const ROOT_CLASS = "__ps_root";
const NON_FLOW_POSITIONS = new Set(["absolute", "fixed"]);

function toStringOrDefault(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function toNumberOrDefault(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeHtmlTag(value: unknown) {
  const raw = toStringOrDefault(value, "div")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!raw || raw === "html" || raw === "head") return "div";
  return raw;
}

function ensureRootClass(className: string) {
  const tokens = className.split(/\s+/).filter(Boolean);
  if (tokens.includes(ROOT_CLASS)) return className;
  return [...tokens, ROOT_CLASS].join(" ");
}

function parsePx(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value || "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseCssLength(value: string, parentSize: number, fallback: number) {
  const raw = (value || "").trim().toLowerCase().replace(/\s+/g, "");
  if (!raw) return fallback;
  if (raw === "auto") return fallback;
  if (raw.endsWith("%")) {
    const pct = Number.parseFloat(raw.slice(0, -1));
    return Number.isFinite(pct) ? (parentSize * pct) / 100 : fallback;
  }
  if (raw.endsWith("rem")) {
    const rem = Number.parseFloat(raw.slice(0, -3));
    return Number.isFinite(rem) ? rem * 16 : fallback;
  }
  if (raw.endsWith("px")) {
    const px = Number.parseFloat(raw.slice(0, -2));
    return Number.isFinite(px) ? px : fallback;
  }
  const numeric = Number.parseFloat(raw);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function resolveChildWidth(shape: HtmlShape, parentWidth: number) {
  if (shape.props.widthCss === "auto") return shape.props.w;
  if (!shape.props.widthCss || shape.props.widthCss === "100%")
    return parentWidth;
  return parseCssLength(shape.props.widthCss, parentWidth, shape.props.w);
}

function resolveChildHeight(shape: HtmlShape, parentHeight: number) {
  if (shape.props.heightCss === "auto") return shape.props.h;
  if (!shape.props.heightCss || shape.props.heightCss === "100%")
    return shape.props.h;
  return parseCssLength(shape.props.heightCss, parentHeight, shape.props.h);
}

function resolveFlexMainSize(
  shape: HtmlShape,
  isRow: boolean,
  parentMainSize: number,
) {
  const css = (isRow ? shape.props.widthCss : shape.props.heightCss).trim();
  // For flex items, treat default/100% as intrinsic size to avoid first-child takeover.
  if (!css || css === "auto" || css === "100%") {
    return isRow ? shape.props.w : shape.props.h;
  }
  return parseCssLength(
    css,
    parentMainSize,
    isRow ? shape.props.w : shape.props.h,
  );
}

function applyHtmlLayout(editor: Editor) {
  const htmlShapes = editor
    .getCurrentPageShapes()
    .filter((shape): shape is HtmlShape => shape.type === "html");

  const childrenByParent = new Map<string, HtmlShape[]>();
  for (const shape of htmlShapes) {
    const parentId = shape.props.parentElementId || "";
    const bucket = childrenByParent.get(parentId) ?? [];
    bucket.push(shape);
    childrenByParent.set(parentId, bucket);
  }

  for (const [key, children] of childrenByParent) {
    childrenByParent.set(
      key,
      children.sort((a, b) => a.index.localeCompare(b.index)),
    );
  }

  const next = new Map(
    htmlShapes.map((shape) => [
      String(shape.id),
      { x: shape.x, y: shape.y, w: shape.props.w, h: shape.props.h },
    ]),
  );

  const layoutChildrenOf = (parent: HtmlShape) => {
    const parentFrame = next.get(String(parent.id));
    if (!parentFrame) return;

    const children = childrenByParent.get(String(parent.id)) ?? [];
    const padding = parsePx(parent.props.padding, 12);
    const gap = parsePx(parent.props.gap, 0);
    const contentX = parentFrame.x + padding;
    const contentY = parentFrame.y + padding;
    const contentW = Math.max(40, parentFrame.w - padding * 2);
    const contentH = Math.max(40, parentFrame.h - padding * 2);

    const flowChildren = children.filter(
      (child) => !NON_FLOW_POSITIONS.has(child.props.position),
    );

    if (parent.props.display === "flex") {
      const isRow =
        parent.props.flexDirection !== "column" &&
        parent.props.flexDirection !== "column-reverse";
      const isReverse =
        parent.props.flexDirection === "row-reverse" ||
        parent.props.flexDirection === "column-reverse";
      const orderedChildren = isReverse
        ? [...flowChildren].reverse()
        : flowChildren;
      const mainSize = isRow ? contentW : contentH;
      const crossSize = isRow ? contentH : contentW;
      const childMainSizes = orderedChildren.map((child) =>
        Math.max(
          0,
          Math.min(mainSize, resolveFlexMainSize(child, isRow, mainSize)),
        ),
      );
      const totalMainUsed =
        childMainSizes.reduce((sum, size) => sum + size, 0) +
        Math.max(0, orderedChildren.length - 1) * gap;
      const freeMain = Math.max(0, mainSize - totalMainUsed);

      let startOffset = 0;
      let betweenGap = gap;
      switch (parent.props.justifyContent) {
        case "flex-end":
          startOffset = freeMain;
          break;
        case "center":
          startOffset = freeMain / 2;
          break;
        case "space-between":
          betweenGap =
            orderedChildren.length > 1
              ? gap + freeMain / (orderedChildren.length - 1)
              : 0;
          break;
        case "space-around":
          betweenGap =
            orderedChildren.length > 0
              ? gap + freeMain / orderedChildren.length
              : gap;
          startOffset = betweenGap / 2;
          break;
        case "space-evenly":
          betweenGap =
            orderedChildren.length > 0
              ? gap + freeMain / (orderedChildren.length + 1)
              : gap;
          startOffset = betweenGap;
          break;
        default:
          startOffset = 0;
      }

      let cursorMain = startOffset;
      for (const [i, child] of orderedChildren.entries()) {
        const childFrame = next.get(String(child.id));
        if (!childFrame) continue;

        const main = childMainSizes[i] ?? 0;
        const crossIntrinsic = isRow
          ? resolveChildHeight(child, contentH)
          : resolveChildWidth(child, contentW);
        const cross =
          parent.props.alignItems === "stretch"
            ? crossSize
            : Math.max(0, Math.min(crossSize, crossIntrinsic));

        let crossOffset = 0;
        switch (parent.props.alignItems) {
          case "flex-end":
            crossOffset = crossSize - cross;
            break;
          case "center":
            crossOffset = (crossSize - cross) / 2;
            break;
          default:
            crossOffset = 0;
        }

        if (isRow) {
          childFrame.x = contentX + cursorMain;
          childFrame.y = contentY + crossOffset;
          childFrame.w = main;
          childFrame.h = cross;
        } else {
          childFrame.x = contentX + crossOffset;
          childFrame.y = contentY + cursorMain;
          childFrame.w = cross;
          childFrame.h = main;
        }

        cursorMain += main + betweenGap;
      }
    } else {
      let cursorY = contentY;
      for (const child of flowChildren) {
        const childFrame = next.get(String(child.id));
        if (!childFrame) continue;
        const h = Math.max(
          0,
          Math.min(contentH, resolveChildHeight(child, contentH)),
        );
        childFrame.x = contentX;
        childFrame.y = cursorY;
        childFrame.w = Math.max(
          0,
          Math.min(contentW, resolveChildWidth(child, contentW)),
        );
        childFrame.h = h;
        cursorY += h + gap;
      }
    }

    // Clamp absolutely positioned children to parent bounds only if they are out of range.
    for (const child of children) {
      const childFrame = next.get(String(child.id));
      if (!childFrame) continue;
      const maxX = Math.max(contentX, contentX + contentW - childFrame.w);
      const maxY = Math.max(contentY, contentY + contentH - childFrame.h);
      childFrame.x = Math.min(maxX, Math.max(contentX, childFrame.x));
      childFrame.y = Math.min(maxY, Math.max(contentY, childFrame.y));
    }

    for (const child of children) layoutChildrenOf(child);
  };

  const roots = htmlShapes.filter((shape) => !shape.props.parentElementId);
  for (const root of roots) layoutChildrenOf(root);

  const updates = htmlShapes
    .map((shape) => {
      const frame = next.get(String(shape.id));
      if (!frame) return null;
      if (
        frame.x === shape.x &&
        frame.y === shape.y &&
        frame.w === shape.props.w &&
        frame.h === shape.props.h
      ) {
        return null;
      }
      return {
        id: shape.id,
        type: "html" as const,
        x: frame.x,
        y: frame.y,
        props: {
          ...shape.props,
          w: frame.w,
          h: frame.h,
        },
      };
    })
    .filter(Boolean);

  if (updates.length === 0) return;
  editor.store.mergeRemoteChanges(() => {
    editor.updateShapes(updates as never);
  });
}

function migrateLegacyHtmlRecord(record: TLRecord): TLRecord {
  const shape = record as TLRecord & {
    typeName?: string;
    type?: string;
    props?: Record<string, unknown>;
  };

  if (shape.typeName !== "shape" || shape.type !== "html") return record;

  const props = shape.props ?? {};
  const legacyHtml = toStringOrDefault(props.html, "");

  const parentElementId = toStringOrDefault(props.parentElementId, "");
  const tag = normalizeHtmlTag(props.tag);
  let className = toStringOrDefault(props.className, "");
  if (parentElementId === "") {
    className = ensureRootClass(className);
  }

  const migratedProps = {
    w: toNumberOrDefault(props.w, 320),
    h: toNumberOrDefault(props.h, 160),
    tag,
    textContent: toStringOrDefault(
      props.textContent,
      legacyHtml || "HTML Element",
    ),
    className,
    parentElementId,
    display: toStringOrDefault(props.display, "block"),
    position: toStringOrDefault(props.position, "static"),
    flexDirection: toStringOrDefault(props.flexDirection, "row"),
    justifyContent: toStringOrDefault(props.justifyContent, "flex-start"),
    alignItems: toStringOrDefault(props.alignItems, "stretch"),
    gap: toStringOrDefault(props.gap, "0"),
    gridTemplateColumns: toStringOrDefault(props.gridTemplateColumns, "1fr"),
    gridTemplateRows: toStringOrDefault(props.gridTemplateRows, "auto"),
    top: toStringOrDefault(props.top, ""),
    left: toStringOrDefault(props.left, ""),
    right: toStringOrDefault(props.right, ""),
    bottom: toStringOrDefault(props.bottom, ""),
    padding: toStringOrDefault(props.padding, "12px"),
    margin: toStringOrDefault(props.margin, "0"),
    backgroundColor: toStringOrDefault(props.backgroundColor, "#1f1f1f"),
    color: toStringOrDefault(props.color, "#ffffff"),
    border: toStringOrDefault(props.border, "1px solid #444"),
    borderRadius: toStringOrDefault(props.borderRadius, "8px"),
    fontSize: toStringOrDefault(props.fontSize, "14px"),
    widthCss: toStringOrDefault(props.widthCss, "100%"),
    heightCss: toStringOrDefault(props.heightCss, "100%"),
    customCss: toStringOrDefault(props.customCss, ""),
  };

  return {
    ...shape,
    props: migratedProps,
  } as TLRecord;
}

function migrateInitialRecords(records: TLRecord[]) {
  return records.map(migrateLegacyHtmlRecord);
}

function WhiteBoard({
  onEditorMount,
  initialRecords = [],
  onRecordsChange,
}: WhiteBoardProps) {
  const editorRef = useRef<Editor | null>(null);
  const didApplyInitialRecords = useRef(false);
  const altPressedRef = useRef(false);
  const pointerDownRef = useRef(false);
  const duplicatedThisDragRef = useRef(false);
  const migratedInitialRecords = useMemo(
    () => migrateInitialRecords(initialRecords),
    [initialRecords],
  );

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    // Force dark mode
    editor.user.updateUserPreferences({ colorScheme: "dark" });

    editor.setCurrentTool("select");

    if (migratedInitialRecords.length > 0 && !didApplyInitialRecords.current) {
      editor.store.mergeRemoteChanges(() => {
        editor.store.put(migratedInitialRecords);
      });
      didApplyInitialRecords.current = true;
    }

    editor.store.listen(() => {
      applyHtmlLayout(editor);
      if (!onRecordsChange) return;
      const records = Array.from(editor.store.allRecords().values());
      onRecordsChange(records);
    });

    if (onEditorMount) {
      onEditorMount(editor);
    }
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (
      !editor ||
      didApplyInitialRecords.current ||
      migratedInitialRecords.length === 0
    ) {
      return;
    }

    editor.store.mergeRemoteChanges(() => {
      editor.store.put(migratedInitialRecords);
    });
    didApplyInitialRecords.current = true;
  }, [migratedInitialRecords]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.key === "Alt") {
        altPressedRef.current = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!event.altKey || event.key === "Alt") {
        altPressedRef.current = false;
      }
    };

    const onPointerDown = () => {
      if (!altPressedRef.current || !editorRef.current) return;
      if (editorRef.current.getSelectedShapes().length === 0) return;
      pointerDownRef.current = true;
      duplicatedThisDragRef.current = false;
    };

    const onPointerMove = () => {
      const editor = editorRef.current;
      if (!editor) return;
      if (!altPressedRef.current || !pointerDownRef.current) return;
      if (duplicatedThisDragRef.current) return;

      const selectedShapes = editor.getSelectedShapes();
      if (selectedShapes.length === 0) return;

      const clones = selectedShapes.map((shape) => ({
        id: createShapeId(),
        type: shape.type,
        x: shape.x + 24,
        y: shape.y + 24,
        props: shape.props,
      }));

      editor.createShapes(clones as never);
      editor.select(...(clones.map((shape) => shape.id) as never[]));
      duplicatedThisDragRef.current = true;
    };

    const onPointerUp = () => {
      pointerDownRef.current = false;
      duplicatedThisDragRef.current = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const shapeUtils = useMemo(() => [HtmlShapeUtil], []);

  return (
    <Tldraw
      tools={defaultTools}
      autoFocus={true}
      onMount={handleMount}
      shapeUtils={shapeUtils}
    />
  );
}

export default WhiteBoard;
