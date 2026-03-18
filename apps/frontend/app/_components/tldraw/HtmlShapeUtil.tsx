import React from "react";
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  Rectangle2d,
  T,
  type TLBaseShape,
} from "tldraw";

export type HtmlShape = TLBaseShape<
  "html",
  {
    w: number;
    h: number;
    tag: string;
    textContent: string;
    className: string;
    parentElementId: string;
    display: string;
    position: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    gap: string;
    gridTemplateColumns: string;
    gridTemplateRows: string;
    top: string;
    left: string;
    right: string;
    bottom: string;
    padding: string;
    margin: string;
    backgroundColor: string;
    color: string;
    border: string;
    borderRadius: string;
    fontSize: string;
    widthCss: string;
    heightCss: string;
    customCss: string;
  }
>;

function sanitizeTag(tag: string) {
  const clean = tag.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!clean) return "div";
  // Never render document-level tags inside the canvas DOM.
  if (clean === "html" || clean === "head" || clean === "body") return "div";
  return clean;
}

function parseCustomCss(customCss: string) {
  const style: Record<string, string> = {};
  const entries = customCss
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const [rawKey, ...rest] = entry.split(":");
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey
      .trim()
      .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    const value = rest.join(":").trim();
    if (!value) continue;
    style[key] = value;
  }

  return style;
}

export class HtmlShapeUtil extends BaseBoxShapeUtil<HtmlShape> {
  static override type = "html" as const;

  static override props = {
    w: T.number,
    h: T.number,
    tag: T.string,
    textContent: T.string,
    className: T.string,
    parentElementId: T.string,
    display: T.string,
    position: T.string,
    flexDirection: T.string,
    justifyContent: T.string,
    alignItems: T.string,
    gap: T.string,
    gridTemplateColumns: T.string,
    gridTemplateRows: T.string,
    top: T.string,
    left: T.string,
    right: T.string,
    bottom: T.string,
    padding: T.string,
    margin: T.string,
    backgroundColor: T.string,
    color: T.string,
    border: T.string,
    borderRadius: T.string,
    fontSize: T.string,
    widthCss: T.string,
    heightCss: T.string,
    customCss: T.string,
  };

  getDefaultProps(): HtmlShape["props"] {
    return {
      w: 320,
      h: 160,
      tag: "div",
      textContent: "HTML Element",
      className: "",
      parentElementId: "",
      display: "block",
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
      padding: "12px",
      margin: "0",
      backgroundColor: "#1f1f1f",
      color: "#ffffff",
      border: "1px solid #444",
      borderRadius: "8px",
      fontSize: "14px",
      widthCss: "100%",
      heightCss: "100%",
      customCss: "",
    };
  }

  getGeometry(shape: HtmlShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: HtmlShape) {
    const tag = sanitizeTag(shape.props.tag);
    const customStyle = parseCustomCss(shape.props.customCss);

    const elementStyle: React.CSSProperties = {
      display: shape.props.display as React.CSSProperties["display"],
      position: shape.props.position as React.CSSProperties["position"],
      flexDirection: shape.props
        .flexDirection as React.CSSProperties["flexDirection"],
      justifyContent: shape.props
        .justifyContent as React.CSSProperties["justifyContent"],
      alignItems: shape.props.alignItems as React.CSSProperties["alignItems"],
      gap: shape.props.gap || undefined,
      gridTemplateColumns: shape.props.gridTemplateColumns || undefined,
      gridTemplateRows: shape.props.gridTemplateRows || undefined,
      top: shape.props.top || undefined,
      left: shape.props.left || undefined,
      right: shape.props.right || undefined,
      bottom: shape.props.bottom || undefined,
      width: shape.props.widthCss || "100%",
      height: shape.props.heightCss || "100%",
      padding: shape.props.padding || undefined,
      margin: shape.props.margin || undefined,
      backgroundColor: shape.props.backgroundColor || undefined,
      color: shape.props.color || undefined,
      border: shape.props.border || undefined,
      borderRadius: shape.props.borderRadius || undefined,
      fontSize: shape.props.fontSize || undefined,
      boxSizing: "border-box",
      overflow: "hidden",
      ...customStyle,
    };

    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          borderRadius: 8,
        }}
      >
        {React.createElement(tag, {
          className: shape.props.className || undefined,
          style: elementStyle,
          children: shape.props.textContent,
        })}
      </HTMLContainer>
    );
  }

  indicator(shape: HtmlShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}
