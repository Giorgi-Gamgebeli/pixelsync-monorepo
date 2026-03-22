"use client";

import type InfiniteViewer from "react-infinite-viewer";
import type Moveable from "react-moveable";

export type MoveableDragLikeEvent = {
  target: EventTarget & (HTMLElement | SVGElement);
  beforeTranslate: number[];
};

export type MoveableResizeLikeEvent = {
  target: EventTarget & (HTMLElement | SVGElement);
  width: number;
  height: number;
  drag: {
    beforeTranslate: number[];
  };
};

export type BoardViewerLike = InfiniteViewer;

export type GrapesComponentLike = any;
export type GrapesEditorLike = any;

export type MoveableRefLike = Moveable | null;
