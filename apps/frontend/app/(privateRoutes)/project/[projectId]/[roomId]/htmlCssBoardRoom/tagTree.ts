import { STYLE_KEYS } from "./constants";
import { createEmptyStyleDraft } from "./utils";
import type { StyleDraft, TagTreeNode } from "./types";

export function toComponentArray(collection: any): any[] {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection.models)) return collection.models;
  if (typeof collection.toArray === "function") {
    const asArray = collection.toArray();
    if (Array.isArray(asArray)) return asArray;
  }
  if (
    typeof collection.at === "function" &&
    Number.isFinite(collection.length)
  ) {
    const asArray: any[] = [];
    for (let index = 0; index < Number(collection.length); index += 1) {
      const item = collection.at(index);
      if (item) asArray.push(item);
    }
    return asArray;
  }
  return [];
}

export function getComponentChildren(component: any): any[] {
  const collection = component?.components?.();
  return toComponentArray(collection);
}

export function getLastComponentFromInsertResult(result: any): any {
  const inserted = toComponentArray(result);
  if (inserted.length > 0) return inserted[inserted.length - 1];
  if (result?.cid) return result;
  return null;
}

export function readStyleDraft(component: any): StyleDraft {
  const next = createEmptyStyleDraft();
  const style = (component?.getStyle?.() ?? {}) as Record<string, unknown>;
  for (const key of STYLE_KEYS) {
    const value = style[key];
    next[key] = typeof value === "string" ? value : "";
  }
  return next;
}

export function readComponentText(component: any): string {
  if (!component) return "";
  const direct = String(component?.get?.("content") ?? "");
  if (direct.trim()) return direct;

  const childText = getComponentChildren(component)
    .filter((child) => {
      const type = String(child?.get?.("type") ?? "")
        .toLowerCase()
        .trim();
      return type === "textnode" || type === "text";
    })
    .map((child) => String(child?.get?.("content") ?? ""))
    .join("")
    .trim();

  return childText;
}

export function buildTagTreeNode(component: any): TagTreeNode | null {
  const type = String(component?.get?.("type") ?? "")
    .toLowerCase()
    .trim();
  const rawTag = String(component?.get?.("tagName") ?? "")
    .toLowerCase()
    .trim();

  const children = getComponentChildren(component)
    .map((child) => buildTagTreeNode(child))
    .filter(Boolean) as TagTreeNode[];

  // Hide only raw text nodes; GrapesJS "text" components are still element tags.
  if (type === "textnode") {
    return null;
  }

  let tagName = rawTag;
  if (!tagName) {
    if (type) {
      tagName = type;
    } else {
      tagName = "node";
    }
  }

  return {
    cid: String(component?.cid ?? crypto.randomUUID()),
    tagName,
    children,
  };
}

export function findComponentByCid(component: any, cid: string): any {
  if (!component) return null;
  if (String(component.cid) === cid) return component;
  const children = getComponentChildren(component);
  for (const child of children) {
    const found = findComponentByCid(child, cid);
    if (found) return found;
  }
  return null;
}

export function componentTreeContainsCid(component: any, cid: string): boolean {
  if (!component) return false;
  if (String(component.cid) === cid) return true;
  const children = getComponentChildren(component);
  for (const child of children) {
    if (componentTreeContainsCid(child, cid)) return true;
  }
  return false;
}

export function getElementChildrenComponents(component: any): any[] {
  return getComponentChildren(component).filter((child) => {
    const type = String(child?.get?.("type") ?? "")
      .toLowerCase()
      .trim();
    return type !== "textnode";
  });
}

export function getDomElementPath(
  target: globalThis.Element,
  body: HTMLElement,
): number[] {
  const path: number[] = [];
  let current: globalThis.Element | null = target;

  while (current && current !== body) {
    const parentElement: HTMLElement | null = current.parentElement;
    if (!parentElement) break;
    const index = Array.from(parentElement.children).indexOf(current);
    if (index < 0) break;
    path.unshift(index);
    current = parentElement;
  }

  return path;
}

export function findComponentByDomPath(wrapper: any, path: number[]): any {
  let current = wrapper;
  for (const index of path) {
    const children = getElementChildrenComponents(current);
    const next = children[index];
    if (!next) return null;
    current = next;
  }
  return current;
}

export function getComponentPathFromWrapper(
  wrapper: any,
  targetCid: string,
  path: number[] = [],
): number[] | null {
  if (!wrapper) return null;
  if (String(wrapper?.cid) === String(targetCid)) return path;

  const children = getElementChildrenComponents(wrapper);
  for (let index = 0; index < children.length; index += 1) {
    const found = getComponentPathFromWrapper(children[index], targetCid, [
      ...path,
      index,
    ]);
    if (found) return found;
  }
  return null;
}

export function getDomByPath(
  body: HTMLElement,
  path: number[],
): Element | null {
  if (path.length === 0) return body;
  let current: Element = body;
  for (const index of path) {
    const next = current.children.item(index);
    if (!next) return null;
    current = next;
  }
  return current;
}
