export const BOARD_WIDTH = 12000;
export const BOARD_HEIGHT = 12000;
export const INITIAL_BOARD_ZOOM = 0.3;

export const PAGE_PRESETS = [
  { key: "mobile", label: "Mobile 390 x 844", w: 390, h: 844 },
  { key: "tablet", label: "Tablet 768 x 1024", w: 768, h: 1024 },
  { key: "laptop", label: "Laptop 1366 x 1800", w: 1366, h: 1800 },
  { key: "desktop", label: "Desktop 1440 x 2200", w: 1440, h: 2200 },
  { key: "fullhd", label: "Full HD 1920 x 3000", w: 1920, h: 3000 },
] as const;

export const TAG_OPTIONS = [
  "div",
  "section",
  "article",
  "header",
  "main",
  "footer",
  "nav",
  "aside",
  "h1",
  "h2",
  "h3",
  "p",
  "span",
  "button",
  "input",
  "textarea",
  "img",
  "ul",
  "li",
];

export const STYLE_GROUPS = [
  {
    title: "Layout & Flow",
    keys: [
      "display",
      "position",
      "width",
      "height",
      "top",
      "left",
      "right",
      "bottom",
      "padding",
      "margin",
      "gap",
      "flex-direction",
      "justify-content",
      "align-items",
    ],
  },
  {
    title: "Visual & Color",
    keys: ["background-color", "color", "border", "border-radius"],
  },
  {
    title: "Typography",
    keys: ["font-size", "font-weight"],
  },
] as const;

export const STYLE_KEYS = STYLE_GROUPS.flatMap((group) => group.keys);

export const STYLE_SELECT_OPTIONS: Record<string, string[]> = {
  display: ["", "block", "inline-block", "inline", "flex", "grid", "none"],
  position: ["", "static", "relative", "absolute", "fixed", "sticky"],
  "flex-direction": ["", "row", "column", "row-reverse", "column-reverse"],
  "justify-content": [
    "",
    "flex-start",
    "center",
    "flex-end",
    "space-between",
    "space-around",
    "space-evenly",
  ],
  "align-items": [
    "",
    "stretch",
    "flex-start",
    "center",
    "flex-end",
    "baseline",
  ],
};
