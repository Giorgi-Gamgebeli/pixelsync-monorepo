"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createShapeId, Editor, TLRecord } from "tldraw";
import ComponentTree from "./ComponentTree";
import PropertiesPanel from "./PropertiesPanel";
import InviteModal from "../InviteModal";
import {
  getBoardRecords,
  saveBoardRecords,
} from "@/app/_dataAccessLayer/actions";
import toast from "react-hot-toast";
import type { HtmlShape } from "@/app/_components/tldraw/HtmlShapeUtil";

const WhiteBoard = dynamic(() => import("@/app/_components/WhiteBoard"), {
  ssr: false,
  loading: () => (
    <div className="bg-primary flex flex-1 items-center justify-center">
      <p className="text-sm text-gray-500">Loading canvas...</p>
    </div>
  ),
});

const HtmlCssBoardRoom = dynamic(() => import("./HtmlCssBoardRoom"), {
  ssr: false,
  loading: () => (
    <div className="bg-primary flex flex-1 items-center justify-center">
      <p className="text-sm text-gray-500">Loading HTML/CSS board...</p>
    </div>
  ),
});

type RoomCanvasProps = {
  roomId: number;
  roomName: string;
  projectId: string;
  onlineCount: number;
  boardType: "NORMAL" | "WEB_DESIGN" | "WEB_DESIGN_HTML_CSS";
};

const ROOT_CLASS = "__ps_root";

function normalizeTag(value: string) {
  const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!clean || clean === "html" || clean === "head") return "div";
  return clean;
}

function TldrawRoomCanvas({
  roomId,
  roomName,
  projectId,
  onlineCount,
  boardType,
}: RoomCanvasProps) {
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [layersOpen, setLayersOpen] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [initialRecords, setInitialRecords] = useState<TLRecord[]>([]);
  const [recordsReady, setRecordsReady] = useState(false);
  const [showHtmlImport, setShowHtmlImport] = useState(false);
  const [htmlInput, setHtmlInput] = useState("div");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPayloadRef = useRef("");

  const isWebDesign = boardType === "WEB_DESIGN";

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      const result = await getBoardRecords(roomId);

      if (!active) return;

      if (Array.isArray(result)) {
        setInitialRecords(result as TLRecord[]);
      }

      setRecordsReady(true);
    }

    loadRecords();

    return () => {
      active = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [roomId]);

  const canImportHtml = useMemo(
    () => isWebDesign && !!editor,
    [isWebDesign, editor],
  );

  useEffect(() => {
    if (!editor || !isWebDesign || !recordsReady) return;

    const htmlShapes = editor
      .getCurrentPageShapes()
      .filter((shape) => shape.type === "html");

    if (htmlShapes.length > 0) return;

    const center = editor.getViewportPageBounds().center;
    const bodyId = createShapeId();

    editor.createShape<HtmlShape>({
      id: bodyId,
      type: "html",
      x: center.x - 360,
      y: center.y - 240,
      props: {
        w: 720,
        h: 480,
        tag: "body",
        textContent: "",
        className: ROOT_CLASS,
        parentElementId: "",
        display: "block",
        position: "relative",
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
        padding: "24px",
        margin: "0",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        border: "none",
        borderRadius: "0",
        fontSize: "14px",
        widthCss: "100%",
        heightCss: "100%",
        customCss: "",
      },
    });

    editor.select(bodyId);
  }, [editor, isWebDesign, recordsReady]);

  async function handleRecordsChange(records: TLRecord[]) {
    const payload = JSON.stringify(records);

    if (payload === lastSavedPayloadRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      const result = await saveBoardRecords(roomId, payload);
      if (result && typeof result === "object" && "error" in result) {
        toast.error("Failed to save board");
        return;
      }
      lastSavedPayloadRef.current = payload;
    }, 1000);
  }

  function handleImportHtml() {
    if (!editor) return;

    const tag = normalizeTag(htmlInput.trim());
    if (!tag) {
      toast.error("Enter a tag name before importing");
      return;
    }

    const center = editor.getViewportPageBounds().center;
    const shapeId = createShapeId();
    const rootShape = editor
      .getCurrentPageShapes()
      .filter((shape): shape is HtmlShape => shape.type === "html")
      .find(
        (shape) =>
          shape.props.parentElementId === "" &&
          shape.props.className.split(/\s+/).includes(ROOT_CLASS),
      );

    editor.createShape<HtmlShape>({
      id: shapeId,
      type: "html",
      x: center.x - 160,
      y: center.y - 80,
      props: {
        w: 320,
        h: 160,
        tag,
        textContent: `${tag} content`,
        className: "",
        parentElementId: rootShape?.id ?? "",
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
        backgroundColor: "#1f2937",
        color: "#ffffff",
        border: "1px solid #334155",
        borderRadius: "8px",
        fontSize: "14px",
        widthCss: "100%",
        heightCss: "100%",
        customCss: "",
      },
    });

    editor.select(shapeId);
    setShowHtmlImport(false);
    toast.success("HTML element imported");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Minimal room header */}
      <div className="border-border flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/project/${projectId}`}
            className="hover:bg-surface flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:text-gray-300"
            aria-label="Back to project"
          >
            <Icon icon="mdi:arrow-left" className="text-lg" />
          </Link>
          <div className="bg-border h-4 w-px" />
          <h2 className="text-sm font-medium text-white">{roomName}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Online presence */}
          <div className="bg-surface/60 flex items-center gap-1.5 rounded-lg px-2.5 py-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400">{onlineCount} online</span>
          </div>

          {/* Invite */}
          <button
            onClick={() => setShowInvite(true)}
            className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white"
          >
            <Icon icon="mdi:share-variant" className="text-sm" />
            Share
          </button>

          <div className="bg-border mx-1 h-4 w-px" />

          {/* Right side toggles (Web Design Only) */}
          {isWebDesign && (
            <>
              <button
                onClick={() => setShowHtmlImport(true)}
                disabled={!canImportHtml}
                aria-label="Import HTML"
                className="hover:bg-surface flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon icon="mdi:xml" className="text-sm" />
                Import HTML
              </button>
              <button
                onClick={() => setLayersOpen(!layersOpen)}
                aria-label="Toggle Layers"
                className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                  layersOpen
                    ? "bg-brand-500/10 text-brand-400"
                    : "hover:bg-surface text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon icon="mdi:layers-outline" className="text-lg" />
              </button>
              <button
                onClick={() => setPropertiesOpen(!propertiesOpen)}
                aria-label="Toggle Properties"
                className={`relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                  propertiesOpen
                    ? "bg-brand-500/10 text-brand-400"
                    : "hover:bg-surface text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon icon="mdi:tune-variant" className="text-lg" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: Layers (Web Design Only) */}
        {isWebDesign && layersOpen && (
          <div className="border-border bg-secondary flex w-64 shrink-0 flex-col border-r">
            <div className="m-0 min-h-0 flex-1 border-t-0 p-0 [&>div]:border-t-0">
              <ComponentTree editor={editor} />
            </div>
          </div>
        )}

        {/* MIDDLE COLUMN: Canvas takes remaining width */}
        <div className="relative flex-1 bg-[#121212]">
          {recordsReady ? (
            <WhiteBoard
              onEditorMount={setEditor}
              initialRecords={initialRecords}
              onRecordsChange={handleRecordsChange}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
              Loading board...
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Properties (Web Design Only) */}
        {isWebDesign && propertiesOpen && (
          <div className="border-border flex h-full shrink-0 border-l">
            <PropertiesPanel editor={editor} />
          </div>
        )}
      </div>

      {showInvite && (
        <InviteModal
          projectId={projectId}
          projectName={roomName}
          onClose={() => setShowInvite(false)}
        />
      )}

      {showHtmlImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="border-border bg-secondary w-full max-w-2xl rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Import HTML Element
              </h3>
              <button
                onClick={() => setShowHtmlImport(false)}
                className="hover:bg-surface cursor-pointer rounded p-1 text-gray-400 hover:text-white"
                aria-label="Close import modal"
              >
                <Icon icon="mdi:close" />
              </button>
            </div>

            <textarea
              value={htmlInput}
              onChange={(event) => setHtmlInput(event.target.value)}
              className="border-border bg-surface focus:border-brand-500 h-52 w-full rounded-lg border p-3 font-mono text-xs text-gray-200 outline-none"
              placeholder="tag name, e.g. section or button"
            />

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowHtmlImport(false)}
                className="hover:bg-surface cursor-pointer rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleImportHtml}
                className="bg-brand-500 hover:bg-brand-600 cursor-pointer rounded-lg px-3 py-1.5 text-sm text-white"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomCanvas(props: RoomCanvasProps) {
  if (props.boardType === "WEB_DESIGN_HTML_CSS") {
    return (
      <HtmlCssBoardRoom
        roomId={props.roomId}
        roomName={props.roomName}
        projectId={props.projectId}
        onlineCount={props.onlineCount}
      />
    );
  }

  return <TldrawRoomCanvas {...props} />;
}

export default RoomCanvas;
