"use client";

import { useMemo } from "react";
import { STYLE_GROUPS, STYLE_SELECT_OPTIONS, TAG_OPTIONS } from "./constants";
import { labelFromStyleKey } from "./utils";
import { useBoard } from "./BoardContext";

export default function DesignPanel() {
  const {
    nodes,
    selectedIds,
    updateNode,
    importTag,
    setImportTag,
    importAsChild,
    setImportAsChild,
    importSnippet,
    setImportSnippet,
    addTagToSelectedComponent,
    selectRootTag,
    importHtmlSnippetToComponent,
    selectedHtmlTag,
    clearTagSelection,
    selectedTagText,
    applySelectedTagText,
    selectedTagCid,
    moveSelectedTagBy,
    nestSelectedTagIntoPreviousSibling,
    outdentSelectedTag,
    moveTargetCid,
    setMoveTargetCid,
    moveSelectedTagIntoTarget,
    styleDraft,
    applyStyleValue,
    tagTree,
  } = useBoard();

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedIds[0]) ?? null,
    [nodes, selectedIds],
  );

  const moveTargetOptions = useMemo(() => {
    const options: Array<{ cid: string; label: string }> = [];
    const walk = (items: any[], depth: number) => {
      for (const item of items) {
        if (item.cid !== selectedTagCid) {
          const name = item.tagName.startsWith("#")
            ? item.tagName
            : `<${item.tagName}>`;
          options.push({
            cid: item.cid,
            label: `${"  ".repeat(depth)}${name}`,
          });
        }
        if (item.children.length > 0) {
          walk(item.children, depth + 1);
        }
      }
    };
    walk(tagTree, 0);
    return options;
  }, [tagTree, selectedTagCid]);

  return (
    <aside className="border-border bg-secondary flex h-full w-96 flex-col border-l">
      <div className="border-border border-b px-4 py-3">
        <h3 className="text-sm font-medium text-white">Design</h3>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!selectedNode ? (
          <div className="border-border rounded border p-3 text-xs text-gray-500">
            Select one page to edit.
          </div>
        ) : (
          <>
            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                Page
              </h4>
              <input
                value={selectedNode.name}
                onChange={(event) =>
                  updateNode(selectedNode.id, {
                    name: event.target.value,
                  })
                }
                className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                placeholder="Page name"
              />
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                Import HTML Tag
              </h4>
              <div className="space-y-2">
                <select
                  value={importTag}
                  onChange={(event) => setImportTag(event.target.value)}
                  className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-2 text-xs text-white outline-none focus:ring-1"
                >
                  {TAG_OPTIONS.map((tag) => (
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
                  Add as child of selected tag
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={addTagToSelectedComponent}
                    className="bg-brand-500 hover:bg-brand-600 rounded px-3 py-2 text-xs font-medium text-white"
                  >
                    Import Tag
                  </button>
                  <button
                    onClick={selectRootTag}
                    className="bg-surface hover:bg-surface/80 rounded px-3 py-2 text-xs text-gray-300"
                  >
                    Select Root
                  </button>
                </div>

                <textarea
                  value={importSnippet}
                  onChange={(event) => setImportSnippet(event.target.value)}
                  className="bg-surface focus:ring-brand-500 min-h-[74px] w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                  placeholder="Paste raw HTML snippet"
                />
                <button
                  onClick={importHtmlSnippetToComponent}
                  className="bg-surface hover:bg-surface/80 w-full rounded px-3 py-2 text-xs text-gray-200"
                >
                  Import HTML Snippet
                </button>
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                Tag Selection
              </h4>
              <div className="border-border bg-surface/40 rounded border p-2 text-xs text-gray-300">
                Selected tag:{" "}
                <span className="font-medium text-white">
                  {selectedHtmlTag}
                </span>
              </div>
              <button
                onClick={clearTagSelection}
                className="bg-surface hover:bg-surface/80 mt-2 w-full rounded px-3 py-2 text-xs text-gray-300"
              >
                Deselect Tag
              </button>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                Text Content
              </h4>
              <textarea
                value={selectedTagText}
                onChange={(event) => applySelectedTagText(event.target.value)}
                disabled={!selectedTagCid}
                className="bg-surface focus:ring-brand-500 min-h-[74px] w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-40"
                placeholder="Type text for selected tag"
              />
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                Tag Structure
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => moveSelectedTagBy(-1)}
                  disabled={!selectedTagCid}
                  className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Move Up
                </button>
                <button
                  onClick={() => moveSelectedTagBy(1)}
                  disabled={!selectedTagCid}
                  className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Move Down
                </button>
                <button
                  onClick={nestSelectedTagIntoPreviousSibling}
                  disabled={!selectedTagCid}
                  className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Nest In
                </button>
                <button
                  onClick={outdentSelectedTag}
                  disabled={!selectedTagCid}
                  className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Outdent
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  value={moveTargetCid}
                  onChange={(event) => setMoveTargetCid(event.target.value)}
                  className="bg-surface focus:ring-brand-500 col-span-1 rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                >
                  <option value="">Move into...</option>
                  {moveTargetOptions.map((option) => (
                    <option key={option.cid} value={option.cid}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={moveSelectedTagIntoTarget}
                  disabled={!selectedTagCid || !moveTargetCid}
                  className="bg-surface hover:bg-surface/80 rounded px-3 py-1.5 text-xs text-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Move As Child
                </button>
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                Styles
              </h4>
              <div className="space-y-3">
                {STYLE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.keys.map((key) => {
                        const options = STYLE_SELECT_OPTIONS[key];
                        const value = styleDraft[key] ?? "";
                        return (
                          <div key={key} className="col-span-1">
                            <label className="mb-1 block text-[11px] text-gray-400">
                              {labelFromStyleKey(key)}
                            </label>
                            {options ? (
                              <select
                                value={value}
                                onChange={(event) =>
                                  applyStyleValue(key, event.target.value)
                                }
                                className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                              >
                                {options.map((option) => (
                                  <option
                                    key={option || "__empty"}
                                    value={option}
                                  >
                                    {option || "(unset)"}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                value={value}
                                onChange={(event) =>
                                  applyStyleValue(key, event.target.value)
                                }
                                className="bg-surface focus:ring-brand-500 w-full rounded px-2 py-1.5 text-xs text-white outline-none focus:ring-1"
                                placeholder="e.g. 100%, 16px, 1rem"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
