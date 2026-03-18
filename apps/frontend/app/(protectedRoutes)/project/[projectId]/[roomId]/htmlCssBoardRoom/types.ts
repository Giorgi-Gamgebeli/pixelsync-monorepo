export type HtmlCssBoardRoomProps = {
  roomId: number;
  roomName: string;
  projectId: string;
  onlineCount: number;
};

export type HtmlCssNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  html: string;
  css: string;
};

export type TagTreeNode = {
  cid: string;
  tagName: string;
  children: TagTreeNode[];
};

export type StyleDraft = Record<string, string>;
export type TagDropPlacement = "before" | "inside" | "after";

export type MarqueeSelection = {
  originX: number;
  originY: number;
  currentX: number;
  currentY: number;
};
